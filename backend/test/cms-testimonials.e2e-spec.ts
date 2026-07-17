import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-H.2: Testimonials. Copies `GalleryItem`'s (CMS-H.1) shape, minus
 * the required-media exception -- `avatarMediaId` is optional here, so
 * this spec (unlike `cms-gallery.e2e-spec.ts`) doesn't need a real
 * media upload to exercise the happy path, only to prove
 * `avatarUrl` resolves when one is supplied. Also covers the
 * `rating` field's 1-5 range check, the one constraint no other
 * CMS-H type's DTO has.
 */
describe('CMS Testimonials (CMS-H.2 e2e)', () => {
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
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        quote: { en: 'Original quote', fa: 'نقل قول اصلی' },
        authorName: 'Jane Parent',
        authorRole: { en: 'Parent of a 3rd grader' },
        rating: 5,
      });

    expect(createRes.status).toBe(201);
    const testimonialId = createRes.body.id;
    expect(createRes.body.authorName).toBe('Jane Parent');
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/testimonials/${testimonialId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ quote: { en: 'Edited quote' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.quote).toEqual({ en: 'Edited quote' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/testimonials/${testimonialId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/testimonials/${testimonialId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/testimonials/${testimonialId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.quote).toEqual({ en: 'Original quote', fa: 'نقل قول اصلی' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/testimonials/${testimonialId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.quote).toEqual({ en: 'Original quote', fa: 'نقل قول اصلی' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, quote: { en: 'Nope' }, authorName: 'Nobody' });

    expect(res.status).toBe(403);
  });

  it('rejects a rating outside the 1-5 range', async () => {
    const tooHigh = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, quote: { en: 'Great school' }, authorName: 'Jane', rating: 6 });
    expect(tooHigh.status).toBe(400);

    const tooLow = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, quote: { en: 'Great school' }, authorName: 'Jane', rating: 0 });
    expect(tooLow.status).toBe(400);
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const name of ['First Parent', 'Second Parent', 'Third Parent']) {
      const res = await request(server)
        .post('/api/v1/cms/testimonials')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, quote: { en: 'A quote' }, authorName: name });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/testimonials/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/testimonials?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((t: any) => t.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a testimonial from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, quote: { en: 'Site A quote' }, authorName: 'Jane' });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/testimonials/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required and no avatar when none is set', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, quote: { en: 'Draft quote' }, authorName: 'Draft Author' });

    const published = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        quote: { en: 'Published quote', fa: 'نقل قول منتشر شده' },
        authorName: 'Published Author',
        authorRole: { en: 'Parent' },
        rating: 4,
      });

    await request(server)
      .post(`/api/v1/cms/testimonials/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server).get(
      `/api/v1/cms/public/testimonials?siteId=${site.id}`,
    );

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].quote).toBe('Published quote');
    expect(publicRes.body[0].authorName).toBe('Published Author');
    expect(publicRes.body[0].rating).toBe(4);
    expect(publicRes.body[0].avatarUrl).toBeNull();
    expect(publicRes.body[0].status).toBeUndefined();

    expect(publicRes.body.find((t: any) => t.id === draft.body.id)).toBeUndefined();

    const publicResFa = await request(server).get(
      `/api/v1/cms/public/testimonials?siteId=${site.id}&locale=fa`,
    );
    expect(publicResFa.body[0].quote).toBe('نقل قول منتشر شده');
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/testimonials')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, quote: { en: 'Site A quote' }, authorName: 'Jane' });

    await request(server)
      .post(`/api/v1/cms/testimonials/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server).get(
      `/api/v1/cms/public/testimonials?siteId=${otherSite.id}`,
    );

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
