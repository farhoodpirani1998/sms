import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-D.3: CTA, copying Hero's (CMS-D.1)/About's (CMS-D.2) shape 1:1.
 * Mirrors `cms-about.e2e-spec.ts` — confirms the pattern replicates
 * cleanly onto a third content type, per the roadmap's D.3 handoff note.
 */
describe('CMS CTA (CMS-D.3 e2e)', () => {
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

  it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
    const createRes = await request(server)
      .post('/api/v1/cms/cta')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        title: { en: 'Enroll today', fa: 'همین امروز ثبت‌نام کنید' },
        body: { en: 'Original body' },
        buttonLabel: { en: 'Apply now' },
        buttonUrl: 'https://example.com/apply',
      });

    expect(createRes.status).toBe(201);
    const ctaId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/cta/${ctaId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ body: { en: 'Edited body' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.body).toEqual({ en: 'Edited body' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/cta/${ctaId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/cta/${ctaId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/cta/${ctaId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.body).toEqual({ en: 'Original body' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/cta/${ctaId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.body).toEqual({ en: 'Original body' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/cta')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, title: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const label of ['First', 'Second', 'Third']) {
      const res = await request(server)
        .post('/api/v1/cms/cta')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, title: { en: label } });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/cta/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/cta?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((c: any) => c.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a cta item from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/cta')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A cta' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/cta/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/cta')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Draft cta' } });

    const published = await request(server)
      .post('/api/v1/cms/cta')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        title: { en: 'Published cta', fa: 'فراخوان منتشر شده' },
        body: { en: 'English body' },
        buttonLabel: { en: 'Go' },
        buttonUrl: 'https://example.com/go',
      });

    await request(server)
      .post(`/api/v1/cms/cta/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server)
      .get(`/api/v1/public/cta`)
      .set('Host', site.domain);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].title).toBe('Published cta');
    expect(publicRes.body[0].buttonUrl).toBe('https://example.com/go');
    expect(publicRes.body[0].status).toBeUndefined();

    expect(publicRes.body.find((c: any) => c.id === draft.body.id)).toBeUndefined();

    const publicResBadLocale = await request(server)
      .get(`/api/v1/public/cta?locale=de`)
      .set('Host', site.domain);
    expect(publicResBadLocale.body[0].title).toBe('Published cta');

    const publicResFa = await request(server)
      .get(`/api/v1/public/cta?locale=fa`)
      .set('Host', site.domain);
    expect(publicResFa.body[0].title).toBe('فراخوان منتشر شده');
    expect(publicResFa.body[0].body).toBe('English body');
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/cta')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A cta' } });

    await request(server)
      .post(`/api/v1/cms/cta/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/public/cta`)
      .set('Host', otherSite.domain);

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
