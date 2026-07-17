import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-D.6: FAQ, copying Hero's (CMS-D.1)/About's (CMS-D.2)/CTA's
 * (CMS-D.3)/Statistics' (CMS-D.4)/Features' (CMS-D.5) shape 1:1 —
 * simplest field list of the six (`question`/`answer`, both required
 * `LocalizedText`, no scalar/media field). Mirrors
 * `cms-features.e2e-spec.ts`. Last CMS-D sub-phase, so also confirms
 * all six simple content types are wired end to end.
 */
describe('CMS FAQ (CMS-D.6 e2e)', () => {
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
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        question: { en: 'How do I apply?', fa: 'چگونه ثبت‌نام کنم؟' },
        answer: { en: 'Original answer' },
      });

    expect(createRes.status).toBe(201);
    const faqId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/faq/${faqId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ answer: { en: 'Edited answer' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.answer).toEqual({ en: 'Edited answer' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/faq/${faqId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/faq/${faqId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/faq/${faqId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.answer).toEqual({ en: 'Original answer' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/faq/${faqId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.answer).toEqual({ en: 'Original answer' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, question: { en: 'Nope?' }, answer: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('rejects a create missing the required answer field', async () => {
    const res = await request(server)
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, question: { en: 'Missing answer?' } });

    expect(res.status).toBe(400);
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const label of ['First', 'Second', 'Third']) {
      const res = await request(server)
        .post('/api/v1/cms/faq')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, question: { en: label }, answer: { en: label } });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/faq/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/faq?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((f: any) => f.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a faq from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, question: { en: 'Site A faq' }, answer: { en: 'Answer' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/faq/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, question: { en: 'Draft faq' }, answer: { en: 'Draft answer' } });

    const published = await request(server)
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        question: { en: 'Published faq', fa: 'سوال منتشر شده' },
        answer: { en: 'English answer' },
      });

    await request(server)
      .post(`/api/v1/cms/faq/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server).get(`/api/v1/cms/public/faq?siteId=${site.id}`);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].question).toBe('Published faq');
    expect(publicRes.body[0].answer).toBe('English answer');
    expect(publicRes.body[0].status).toBeUndefined();

    expect(publicRes.body.find((f: any) => f.id === draft.body.id)).toBeUndefined();

    const publicResBadLocale = await request(server).get(
      `/api/v1/cms/public/faq?siteId=${site.id}&locale=de`,
    );
    expect(publicResBadLocale.body[0].question).toBe('Published faq');

    const publicResFa = await request(server).get(
      `/api/v1/cms/public/faq?siteId=${site.id}&locale=fa`,
    );
    expect(publicResFa.body[0].question).toBe('سوال منتشر شده');
    expect(publicResFa.body[0].answer).toBe('English answer');
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/faq')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, question: { en: 'Site A faq' }, answer: { en: 'Answer' } });

    await request(server)
      .post(`/api/v1/cms/faq/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server).get(
      `/api/v1/cms/public/faq?siteId=${otherSite.id}`,
    );

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
