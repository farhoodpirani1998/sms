import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll, getDataSource } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';
import { SiteSettings } from '../src/modules/cms/content/site-settings/entities/site-settings.entity';

/**
 * CMS-E.1: Site Settings — the first singleton content type. Same
 * create/edit/publish/revision shape every CMS-D e2e spec exercises,
 * but there is no `POST /cms/site-settings` create route at all (see
 * `SiteSettingsController`'s doc comment): every route is scoped by
 * `?siteId=` alone, and `SiteSettingsService.getOrCreate()` resolves
 * (and, on first access, creates) the one row per Site internally. The
 * spec unique to this type verifies that guarantee directly — repeated
 * access never produces a second row for the same Site — rather than
 * mirroring a "second create returns the existing row" HTTP call that
 * has no route to hang off of here.
 */
describe('CMS Site Settings (CMS-E.1 e2e)', () => {
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

  it('a second (and third) access never creates a second row for the same Site -- get-or-create is idempotent', async () => {
    const firstGet = await request(server)
      .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));

    expect(firstGet.status).toBe(200);
    expect(firstGet.body.siteId).toBe(site.id);
    expect(firstGet.body.status).toBe('draft');
    const settingsId = firstGet.body.id;

    const secondGet = await request(server)
      .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));

    expect(secondGet.status).toBe(200);
    expect(secondGet.body.id).toBe(settingsId);

    // A PATCH also resolves via getOrCreate() internally -- confirm it
    // reuses the same row rather than racing a second one into being.
    const updateRes = await request(server)
      .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ contactEmail: 'info@example.com' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.id).toBe(settingsId);

    const ds = getDataSource(app);
    const rows = await ds.getRepository(SiteSettings).find({ where: { siteId: site.id } as any });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(settingsId);
  });

  it('runs the full edit -> publish -> revision-restore round trip', async () => {
    const createRes = await request(server)
      .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(createRes.status).toBe(200);

    const updateRes = await request(server)
      .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({
        footerText: { en: 'Original footer' },
        contactEmail: 'info@example.com',
        contactPhone: '+982112345678',
        maintenanceMode: false,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.footerText).toEqual({ en: 'Original footer' });
    const settingsId = updateRes.body.id;

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/site-settings/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/site-settings/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const editAfterPublish = await request(server)
      .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ footerText: { en: 'Edited footer' } });
    expect(editAfterPublish.status).toBe(200);
    expect(editAfterPublish.body.footerText).toEqual({ en: 'Edited footer' });

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/site-settings/${settingsId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    // One revision per write: the initial empty get-or-create, the
    // "Original footer" PATCH, the publish snapshot, and the
    // "Edited footer" PATCH -- four in total.
    expect(revisionsRes.body.length).toBe(4);

    const originalFooterRevision = revisionsRes.body.find(
      (r: any) => JSON.stringify(r.snapshot.footerText) === JSON.stringify({ en: 'Original footer' }),
    );
    expect(originalFooterRevision).toBeDefined();

    const restoreRes = await request(server)
      .post(`/api/v1/cms/site-settings/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalFooterRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.footerText).toEqual({ en: 'Original footer' });
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, accountant))
      .send({ contactEmail: 'nope@example.com' });

    expect(res.status).toBe(403);
  });

  it('scopes reads by siteId -- another Site gets its own independent singleton row', async () => {
    const siteAGet = await request(server)
      .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSiteGet = await request(server)
      .get(`/api/v1/cms/site-settings?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(siteAGet.body.id).not.toBe(otherSiteGet.body.id);
  });

  it('public endpoint returns null when nothing has been published yet, then the published row once it has', async () => {
    const beforePublish = await request(server)
      .get(`/api/v1/public/site-settings`)
      .set('Host', site.domain);
    expect(beforePublish.status).toBe(200);
    expect(beforePublish.body).toBeNull();

    await request(server)
      .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        footerText: { en: 'Public footer', fa: 'فوتر عمومی' },
        contactEmail: 'hello@example.com',
        maintenanceMode: true,
      });

    await request(server)
      .post(`/api/v1/cms/site-settings/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const afterPublish = await request(server)
      .get(`/api/v1/public/site-settings`)
      .set('Host', site.domain);

    expect(afterPublish.status).toBe(200);
    expect(afterPublish.body.footerText).toBe('Public footer');
    expect(afterPublish.body.contactEmail).toBe('hello@example.com');
    expect(afterPublish.body.maintenanceMode).toBe(true);

    const afterPublishFa = await request(server)
      .get(`/api/v1/public/site-settings?locale=fa`)
      .set('Host', site.domain);
    expect(afterPublishFa.body.footerText).toBe('فوتر عمومی');

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/public/site-settings`)
      .set('Host', otherSite.domain);
    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toBeNull();
  });
});
