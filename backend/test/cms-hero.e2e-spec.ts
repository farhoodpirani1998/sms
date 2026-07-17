import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-D.1: Hero, the reference implementation for every simple-content
 * type built on `BaseContentService`/`PublishingService`/
 * `OrderingService`/`RevisionsService` (the cross-cutting stack CMS-C
 * proved against the throwaway `ProofBlock`).
 *
 * Covers what's new relative to `cms-proof-block.e2e-spec.ts`:
 * 1. Admin CRUD + publish/revision-restore round trip (mirrors the
 *    proof-block pipeline, now against a real content type).
 * 2. Public read endpoint returns only `PUBLISHED` rows, ordered by
 *    `sortOrder`, localized to the requested locale with fallback to
 *    the Site's `defaultLocale` when the requested locale is
 *    unsupported or a field wasn't translated.
 * 3. Site scoping holds for both admin and public reads.
 */
describe('CMS Hero (CMS-D.1 e2e)', () => {
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
      .post('/api/v1/cms/hero')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        title: { en: 'Welcome', fa: 'خوش آمدید' },
        subtitle: { en: 'Original subtitle' },
        ctaLabel: { en: 'Learn more' },
        ctaUrl: '/about',
      });

    expect(createRes.status).toBe(201);
    const heroId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/hero/${heroId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ subtitle: { en: 'Edited subtitle' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.subtitle).toEqual({ en: 'Edited subtitle' });

    // Staff cannot publish -- CMS_CONTENT_PUBLISH is school_admin-only.
    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/hero/${heroId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/hero/${heroId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    // Three writes so far (create/update/publish) -- three revisions,
    // via the shared generic revisions endpoint (entityType = 'hero').
    const revisionsRes = await request(server)
      .get(`/api/v1/cms/hero/${heroId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.subtitle).toEqual({ en: 'Original subtitle' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/hero/${heroId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.subtitle).toEqual({ en: 'Original subtitle' });
    // Restoring content doesn't touch publish lifecycle state.
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/hero')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, title: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('reorders a real multi-row content type', async () => {
    const heroes = [];
    for (const label of ['First', 'Second', 'Third']) {
      const res = await request(server)
        .post('/api/v1/cms/hero')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, title: { en: label } });
      heroes.push(res.body);
    }

    const reversedIds = [heroes[2].id, heroes[1].id, heroes[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/hero/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/hero?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((h: any) => h.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a hero from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/hero')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A hero' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/hero/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/hero')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Draft hero' } });

    const published = await request(server)
      .post('/api/v1/cms/hero')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        title: { en: 'Published hero', fa: 'قهرمان منتشر شده' },
        subtitle: { en: 'English subtitle' },
      });

    await request(server)
      .post(`/api/v1/cms/hero/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server)
      .get(`/api/v1/cms/public/hero`)
      .set('Host', site.domain);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].title).toBe('Published hero');
    // No `status`/`siteId`/admin-only fields leak into the public shape.
    expect(publicRes.body[0].status).toBeUndefined();

    // Draft never appears publicly.
    expect(publicRes.body.find((h: any) => h.id === draft.body.id)).toBeUndefined();

    // Requesting an unsupported locale falls back to the Site's default.
    const publicResBadLocale = await request(server)
      .get(`/api/v1/cms/public/hero?locale=de`)
      .set('Host', site.domain);
    expect(publicResBadLocale.body[0].title).toBe('Published hero');

    // Requesting a supported locale resolves it; a field only entered in
    // English falls back to the default locale rather than returning null.
    const publicResFa = await request(server)
      .get(`/api/v1/cms/public/hero?locale=fa`)
      .set('Host', site.domain);
    expect(publicResFa.body[0].title).toBe('قهرمان منتشر شده');
    expect(publicResFa.body[0].subtitle).toBe('English subtitle');
  });

  it('public endpoint scopes by siteId -- another Site never sees these heroes', async () => {
    const created = await request(server)
      .post('/api/v1/cms/hero')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A hero' } });

    await request(server)
      .post(`/api/v1/cms/hero/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/cms/public/hero`)
      .set('Host', otherSite.domain);

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
