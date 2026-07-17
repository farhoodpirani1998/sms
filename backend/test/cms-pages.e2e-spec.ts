import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';
import { SitemapService } from '../src/modules/cms/core/seo/sitemap.service';

/**
 * CMS-F.1/F.2: Pages. Admin CRUD + slug-uniqueness + publish (F.1),
 * public by-slug read with `ResolvedSeoMeta` fallback to
 * `Site.seoDefaults`, plus sitemap generation covering at least one
 * published Page (F.2). `SitemapService` has no HTTP route yet (per its
 * doc comment, that lands in CMS-I.5) so this spec calls it directly
 * via `app.get()`, same as any other plain injectable a later e2e can't
 * reach through `supertest` yet.
 */
describe('CMS Pages (CMS-F.1/F.2 e2e)', () => {
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
      domain: `pages-e2e-${Date.now()}.example.com`,
      defaultLocale: 'en',
      supportedLocales: ['en', 'fa'],
      seoDefaults: { title: { en: 'Site default title' }, description: { en: 'Site default description' } },
    } as any);
    otherSite = await createSite(app);
  });

  it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
    const createRes = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        slug: 'admissions',
        title: { en: 'Admissions', fa: 'ثبت‌نام' },
        body: { en: 'Original body' },
      });

    expect(createRes.status).toBe(201);
    const pageId = createRes.body.id;
    expect(createRes.body.slug).toBe('admissions');
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/pages/${pageId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ body: { en: 'Edited body' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.body).toEqual({ en: 'Edited body' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/pages/${pageId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/pages/${pageId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/pages/${pageId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.body).toEqual({ en: 'Original body' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/pages/${pageId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.body).toEqual({ en: 'Original body' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, slug: 'nope', title: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('rejects a malformed slug', async () => {
    const res = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'Not A Slug!', title: { en: 'Bad slug' } });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate slug within the same Site with a 409, but allows it on another Site', async () => {
    const first = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'about-us', title: { en: 'About us' } });
    expect(first.status).toBe(201);

    const duplicate = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'about-us', title: { en: 'About us again' } });
    expect(duplicate.status).toBe(409);

    const otherSitePage = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: otherSite.id, slug: 'about-us', title: { en: 'About us (other site)' } });
    expect(otherSitePage.status).toBe(201);

    const rename = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'contact', title: { en: 'Contact' } });
    expect(rename.status).toBe(201);

    const renameToTaken = await request(server)
      .patch(`/api/v1/cms/pages/${rename.body.id}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ slug: 'about-us' });
    expect(renameToTaken.status).toBe(409);
  });

  it('scopes admin reads by siteId -- a page from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/pages')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, slug: 'site-a-page', title: { en: 'Site A page' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/pages/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  describe('public by-slug read (CMS-F.2)', () => {
    it('resolves a published Page by slug, localized, with its own SEO fields', async () => {
      const draft = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'draft-page', title: { en: 'Draft page' } });

      const published = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({
          siteId: site.id,
          slug: 'admissions',
          title: { en: 'Admissions', fa: 'ثبت‌نام' },
          excerpt: { en: 'How to apply' },
          body: { en: 'Full admissions body' },
          metaTitle: { en: 'Admissions | Our School' },
          metaDescription: { en: 'Learn how to apply.' },
        });

      await request(server)
        .post(`/api/v1/cms/pages/${published.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const notFound = await request(server)
        .get(`/api/v1/cms/public/pages/does-not-exist`)
        .set('Host', site.domain);
      expect(notFound.status).toBe(404);

      const draftFetch = await request(server)
        .get(`/api/v1/cms/public/pages/draft-page`)
        .set('Host', site.domain);
      expect(draftFetch.status).toBe(404);

      const publicRes = await request(server)
        .get(`/api/v1/cms/public/pages/admissions`)
        .set('Host', site.domain);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.id).toBe(published.body.id);
      expect(publicRes.body.title).toBe('Admissions');
      expect(publicRes.body.excerpt).toBe('How to apply');
      expect(publicRes.body.seo.title).toBe('Admissions | Our School');
      expect(publicRes.body.seo.description).toBe('Learn how to apply.');
      expect(publicRes.body.seo.canonicalUrl).toBe(`https://${site.domain}/admissions`);

      const publicResFa = await request(server)
        .get(`/api/v1/cms/public/pages/admissions?locale=fa`)
        .set('Host', site.domain);
      expect(publicResFa.body.title).toBe('ثبت‌نام');

      expect(draft.body.id).not.toBe(published.body.id);
    });

    it('falls back to the Page title and then Site.seoDefaults when a Page has no SEO fields of its own', async () => {
      const published = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'no-seo', title: { en: 'No SEO fields here' } });

      await request(server)
        .post(`/api/v1/cms/pages/${published.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const publicRes = await request(server)
        .get(`/api/v1/cms/public/pages/no-seo`)
        .set('Host', site.domain);

      expect(publicRes.status).toBe(200);
      // No metaTitle set -> falls back to the Page's own title, not the
      // Site default (per PagesService.findPublishedBySlug()'s fallback order).
      expect(publicRes.body.seo.title).toBe('No SEO fields here');
      // No metaDescription and no fallback via title -> falls back to
      // Site.seoDefaults.description.
      expect(publicRes.body.seo.description).toBe('Site default description');
    });

    it('scopes the public by-slug read by siteId -- another Site never resolves this slug', async () => {
      const published = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'shared-slug', title: { en: 'Site A page' } });

      await request(server)
        .post(`/api/v1/cms/pages/${published.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const otherSiteRes = await request(server)
        .get(`/api/v1/cms/public/pages/shared-slug`)
        .set('Host', otherSite.domain);
      expect(otherSiteRes.status).toBe(404);
    });
  });

  describe('sitemap generation (CMS-F.2)', () => {
    it('includes every published Page for the Site, root-cased for the "home" slug, and excludes drafts and other Sites', async () => {
      const home = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'home', title: { en: 'Home' } });
      await request(server)
        .post(`/api/v1/cms/pages/${home.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const admissions = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'admissions', title: { en: 'Admissions' } });
      await request(server)
        .post(`/api/v1/cms/pages/${admissions.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      // Draft page -- must not appear in the sitemap.
      await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'unpublished-draft', title: { en: 'Draft' } });

      // Published page on another Site -- must not leak into this Site's sitemap.
      const otherPage = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: otherSite.id, slug: 'other-site-page', title: { en: 'Other site page' } });
      await request(server)
        .post(`/api/v1/cms/pages/${otherPage.body.id}/publish?siteId=${otherSite.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const sitemapService = app.get(SitemapService);
      const xml = await sitemapService.generate(site.id);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      // "home" slug canonicalizes to the bare domain, not "/home".
      expect(xml).toContain(`<loc>https://${site.domain}</loc>`);
      expect(xml).not.toContain(`<loc>https://${site.domain}/home</loc>`);
      expect(xml).toContain(`<loc>https://${site.domain}/admissions</loc>`);
      expect(xml).not.toContain('unpublished-draft');
      expect(xml).not.toContain('other-site-page');
    });
  });
});
