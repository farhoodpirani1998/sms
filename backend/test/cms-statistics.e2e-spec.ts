import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-D.4: Statistics, copying Hero's (CMS-D.1)/About's (CMS-D.2)/CTA's
 * (CMS-D.3) shape 1:1. Mirrors `cms-cta.e2e-spec.ts` — the roadmap calls
 * this out as the first real (non-proof) content type where
 * `OrderingService.reorder()` sees actual operational use.
 */
describe('CMS Statistics (CMS-D.4 e2e)', () => {
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
      .post('/api/v1/cms/statistics')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        label: { en: 'Graduates', fa: 'فارغ‌التحصیلان' },
        value: '500+',
        icon: 'graduation-cap',
      });

    expect(createRes.status).toBe(201);
    const statisticId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/statistics/${statisticId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ value: '600+' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.value).toBe('600+');

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/statistics/${statisticId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/statistics/${statisticId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/statistics/${statisticId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.value).toBe('500+');

    const restoreRes = await request(server)
      .post(`/api/v1/cms/statistics/${statisticId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.value).toBe('500+');
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/statistics')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, label: { en: 'Nope' }, value: '0' });

    expect(res.status).toBe(403);
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const label of ['First', 'Second', 'Third']) {
      const res = await request(server)
        .post('/api/v1/cms/statistics')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, label: { en: label }, value: '1' });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/statistics/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/statistics?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((s: any) => s.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a statistic from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/statistics')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, label: { en: 'Site A stat' }, value: '1' });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/statistics/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/statistics')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, label: { en: 'Draft stat' }, value: '1' });

    const published = await request(server)
      .post('/api/v1/cms/statistics')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        label: { en: 'Published stat', fa: 'آمار منتشر شده' },
        value: '42',
        icon: 'star',
      });

    await request(server)
      .post(`/api/v1/cms/statistics/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server).get(`/api/v1/cms/public/statistics?siteId=${site.id}`);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].label).toBe('Published stat');
    expect(publicRes.body[0].value).toBe('42');
    expect(publicRes.body[0].icon).toBe('star');
    expect(publicRes.body[0].status).toBeUndefined();

    expect(publicRes.body.find((s: any) => s.id === draft.body.id)).toBeUndefined();

    const publicResBadLocale = await request(server).get(
      `/api/v1/cms/public/statistics?siteId=${site.id}&locale=de`,
    );
    expect(publicResBadLocale.body[0].label).toBe('Published stat');

    const publicResFa = await request(server).get(
      `/api/v1/cms/public/statistics?siteId=${site.id}&locale=fa`,
    );
    expect(publicResFa.body[0].label).toBe('آمار منتشر شده');
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/statistics')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, label: { en: 'Site A stat' }, value: '1' });

    await request(server)
      .post(`/api/v1/cms/statistics/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server).get(
      `/api/v1/cms/public/statistics?siteId=${otherSite.id}`,
    );

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
