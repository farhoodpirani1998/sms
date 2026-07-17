import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-G.1/G.2: News. Mirrors `cms-pages.e2e-spec.ts`'s admin CRUD +
 * slug-uniqueness + publish coverage (G.1) exactly, since `NewsService`
 * copies `PagesService` 1:1 for that half; adds News' one genuine
 * departure from the Pages shape -- the paginated public listing,
 * `findPublishedList()` -- plus the by-slug detail read (G.2).
 */
describe('CMS News (CMS-G.1/G.2 e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  let school: Awaited<ReturnType<typeof createSchool>>;
  let schoolAdmin: Awaited<ReturnType<typeof createUser>>;
  let staff: Awaited<ReturnType<typeof createUser>>;
  let accountant: Awaited<ReturnType<typeof createUser>>;
  let site: Awaited<ReturnType<typeof createSite>>;
  let otherSite: Awaited<ReturnType<typeof createSite>>;

  beforeEach(async () => {
    await truncateAll(app);

    school = await createSchool(app, { name: 'School A' });
    schoolAdmin = await createUser(app, { role: Role.SCHOOL_ADMIN, schoolId: school.id });
    staff = await createUser(app, { role: Role.STAFF, schoolId: school.id });
    accountant = await createUser(app, { role: Role.ACCOUNTANT, schoolId: school.id });

    site = await createSite(app, {
      defaultLocale: 'en',
      supportedLocales: ['en', 'fa'],
    } as any);
    otherSite = await createSite(app);
  });

  async function publish(id: string, forSite = site) {
    return request(server)
      .post(`/api/v1/cms/news/${id}/publish?siteId=${forSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));
  }

  it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
    const createRes = await request(server)
      .post('/api/v1/cms/news')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        slug: 'science-fair-2026',
        title: { en: 'Science Fair 2026', fa: 'نمایشگاه علمی ۲۰۲۶' },
        body: { en: 'Original body' },
      });

    expect(createRes.status).toBe(201);
    const articleId = createRes.body.id;
    expect(createRes.body.slug).toBe('science-fair-2026');
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/news/${articleId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ body: { en: 'Edited body' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.body).toEqual({ en: 'Edited body' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/news/${articleId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await publish(articleId);
    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/news/${articleId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.body).toEqual({ en: 'Original body' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/news/${articleId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.body).toEqual({ en: 'Original body' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/news')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, slug: 'nope', title: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('rejects a duplicate slug within the same Site with a 409, but allows it on another Site', async () => {
    const first = await request(server)
      .post('/api/v1/cms/news')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'welcome-back', title: { en: 'Welcome back' } });
    expect(first.status).toBe(201);

    const duplicate = await request(server)
      .post('/api/v1/cms/news')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'welcome-back', title: { en: 'Welcome back again' } });
    expect(duplicate.status).toBe(409);

    const otherSiteArticle = await request(server)
      .post('/api/v1/cms/news')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: otherSite.id, slug: 'welcome-back', title: { en: 'Welcome back (other site)' } });
    expect(otherSiteArticle.status).toBe(201);
  });

  it('scopes admin reads by siteId -- an article from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/news')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'site-a-article', title: { en: 'Site A article' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/news/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  describe('public paginated listing (CMS-G.2)', () => {
    it('lists only published articles, newest first, paginated, with no body/seo in the summary', async () => {
      const titles = ['First article', 'Second article', 'Third article'];
      const created = [];
      for (const title of titles) {
        const res = await request(server)
          .post('/api/v1/cms/news')
          .set('Authorization', authHeader(app, schoolAdmin))
          .send({
            siteId: site.id,
            slug: title.toLowerCase().replace(/\s+/g, '-'),
            title: { en: title },
            excerpt: { en: `Excerpt for ${title}` },
            body: { en: `Full body for ${title}` },
          });
        created.push(res.body);
        // Small gap so publishedAt ordering is deterministic across rows.
        await new Promise((r) => setTimeout(r, 5));
        await publish(res.body.id);
      }

      const draft = await request(server)
        .post('/api/v1/cms/news')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'draft-article', title: { en: 'Draft article' } });

      const listRes = await request(server)
        .get(`/api/v1/public/news?page=1&limit=2`)
        .set('Host', site.domain);

      expect(listRes.status).toBe(200);
      expect(listRes.body.total).toBe(3);
      expect(listRes.body.page).toBe(1);
      expect(listRes.body.limit).toBe(2);
      expect(listRes.body.data).toHaveLength(2);
      // Newest first: the third article published last.
      expect(listRes.body.data[0].title).toBe('Third article');
      expect(listRes.body.data[0].body).toBeUndefined();
      expect(listRes.body.data.find((a: any) => a.id === draft.body.id)).toBeUndefined();

      const secondPage = await request(server)
        .get(`/api/v1/public/news?page=2&limit=2`)
        .set('Host', site.domain);
      expect(secondPage.body.data).toHaveLength(1);
      expect(secondPage.body.data[0].title).toBe('First article');
    });

    it('scopes the public listing by siteId', async () => {
      const created = await request(server)
        .post('/api/v1/cms/news')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'site-a-only', title: { en: 'Site A only' } });
      await publish(created.body.id);

      const otherSiteListRes = await request(server)
        .get(`/api/v1/public/news`)
        .set('Host', otherSite.domain);
      expect(otherSiteListRes.status).toBe(200);
      expect(otherSiteListRes.body.data).toHaveLength(0);
    });
  });

  describe('public by-slug detail read (CMS-G.2)', () => {
    it('resolves a published article by slug, localized, with body and SEO', async () => {
      const published = await request(server)
        .post('/api/v1/cms/news')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({
          siteId: site.id,
          slug: 'science-fair-2026',
          title: { en: 'Science Fair 2026', fa: 'نمایشگاه علمی ۲۰۲۶' },
          body: { en: 'Full article body' },
        });
      await publish(published.body.id);

      const publicRes = await request(server)
        .get(`/api/v1/public/news/science-fair-2026`)
        .set('Host', site.domain);

      expect(publicRes.status).toBe(200);
      expect(publicRes.body.title).toBe('Science Fair 2026');
      expect(publicRes.body.body).toBe('Full article body');
      expect(publicRes.body.seo.canonicalUrl).toBe(
        `https://${site.domain}/news/science-fair-2026`,
      );

      const notFound = await request(server)
        .get(`/api/v1/public/news/does-not-exist`)
        .set('Host', site.domain);
      expect(notFound.status).toBe(404);
    });
  });
});
