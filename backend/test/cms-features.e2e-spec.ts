import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-D.5: Features, copying Hero's (CMS-D.1)/About's (CMS-D.2)/CTA's
 * (CMS-D.3)/Statistics' (CMS-D.4) shape 1:1. Mirrors
 * `cms-statistics.e2e-spec.ts`. `coverMediaId` is only UUID-shape-
 * checked by the DTO (same "client supplies it, service validates it"
 * split Hero/About already use) so, like `cms-about.e2e-spec.ts`, this
 * spec exercises it as a plain optional field rather than uploading a
 * real `MediaAsset`.
 */
describe('CMS Features (CMS-D.5 e2e)', () => {
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
      .post('/api/v1/cms/features')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        title: { en: 'Small class sizes', fa: 'کلاس‌های کوچک' },
        description: { en: 'Original description' },
        icon: 'users',
      });

    expect(createRes.status).toBe(201);
    const featureId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/features/${featureId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ description: { en: 'Edited description' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.description).toEqual({ en: 'Edited description' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/features/${featureId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/features/${featureId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/features/${featureId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.description).toEqual({ en: 'Original description' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/features/${featureId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.description).toEqual({ en: 'Original description' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/features')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, title: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const label of ['First', 'Second', 'Third']) {
      const res = await request(server)
        .post('/api/v1/cms/features')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, title: { en: label } });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/features/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/features?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((f: any) => f.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a feature from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/features')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A feature' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/features/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/features')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Draft feature' } });

    const published = await request(server)
      .post('/api/v1/cms/features')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        title: { en: 'Published feature', fa: 'ویژگی منتشر شده' },
        description: { en: 'English description' },
        icon: 'star',
      });

    await request(server)
      .post(`/api/v1/cms/features/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server)
      .get(`/api/v1/cms/public/features`)
      .set('Host', site.domain);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].title).toBe('Published feature');
    expect(publicRes.body[0].icon).toBe('star');
    expect(publicRes.body[0].status).toBeUndefined();

    expect(publicRes.body.find((f: any) => f.id === draft.body.id)).toBeUndefined();

    const publicResBadLocale = await request(server)
      .get(`/api/v1/cms/public/features?locale=de`)
      .set('Host', site.domain);
    expect(publicResBadLocale.body[0].title).toBe('Published feature');

    const publicResFa = await request(server)
      .get(`/api/v1/cms/public/features?locale=fa`)
      .set('Host', site.domain);
    expect(publicResFa.body[0].title).toBe('ویژگی منتشر شده');
    expect(publicResFa.body[0].description).toBe('English description');
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/features')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A feature' } });

    await request(server)
      .post(`/api/v1/cms/features/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/cms/public/features`)
      .set('Host', otherSite.domain);

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
