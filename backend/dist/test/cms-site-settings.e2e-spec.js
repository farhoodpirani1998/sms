"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
const site_settings_entity_1 = require("../src/modules/cms/content/site-settings/entities/site-settings.entity");
describe('CMS Site Settings (CMS-E.1 e2e)', () => {
    let app;
    let server;
    beforeAll(async () => {
        app = await (0, test_app_1.createTestApp)();
        server = app.getHttpServer();
    });
    afterAll(async () => {
        await (0, test_app_1.closeTestApp)(app);
    });
    let school;
    let schoolAdmin;
    let staff;
    let accountant;
    let site;
    let otherSite;
    beforeEach(async () => {
        await (0, test_app_1.truncateAll)(app);
        school = await (0, factories_1.createSchool)(app, { name: 'School A' });
        schoolAdmin = await (0, factories_1.createUser)(app, { role: factories_1.Role.SCHOOL_ADMIN, schoolId: school.id });
        staff = await (0, factories_1.createUser)(app, { role: factories_1.Role.STAFF, schoolId: school.id });
        accountant = await (0, factories_1.createUser)(app, { role: factories_1.Role.ACCOUNTANT, schoolId: school.id });
        site = await (0, factories_1.createSite)(app, {
            defaultLocale: 'en',
            supportedLocales: ['en', 'fa'],
        });
        otherSite = await (0, factories_1.createSite)(app);
    });
    it('a second (and third) access never creates a second row for the same Site -- get-or-create is idempotent', async () => {
        const firstGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(firstGet.status).toBe(200);
        expect(firstGet.body.siteId).toBe(site.id);
        expect(firstGet.body.status).toBe('draft');
        const settingsId = firstGet.body.id;
        const secondGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(secondGet.status).toBe(200);
        expect(secondGet.body.id).toBe(settingsId);
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ contactEmail: 'info@example.com' });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.id).toBe(settingsId);
        const ds = (0, test_app_1.getDataSource)(app);
        const rows = await ds.getRepository(site_settings_entity_1.SiteSettings).find({ where: { siteId: site.id } });
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe(settingsId);
    });
    it('runs the full edit -> publish -> revision-restore round trip', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(createRes.status).toBe(200);
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            footerText: { en: 'Original footer' },
            contactEmail: 'info@example.com',
            contactPhone: '+982112345678',
            maintenanceMode: false,
        });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.footerText).toEqual({ en: 'Original footer' });
        const settingsId = updateRes.body.id;
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/site-settings/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/site-settings/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        expect(publishRes.body.publishedAt).toBeDefined();
        const editAfterPublish = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ footerText: { en: 'Edited footer' } });
        expect(editAfterPublish.status).toBe(200);
        expect(editAfterPublish.body.footerText).toEqual({ en: 'Edited footer' });
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/site-settings/${settingsId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(4);
        const originalFooterRevision = revisionsRes.body.find((r) => JSON.stringify(r.snapshot.footerText) === JSON.stringify({ en: 'Original footer' }));
        expect(originalFooterRevision).toBeDefined();
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/site-settings/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalFooterRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.footerText).toEqual({ en: 'Original footer' });
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ contactEmail: 'nope@example.com' });
        expect(res.status).toBe(403);
    });
    it('scopes reads by siteId -- another Site gets its own independent singleton row', async () => {
        const siteAGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/site-settings?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(siteAGet.body.id).not.toBe(otherSiteGet.body.id);
    });
    it('public endpoint returns null when nothing has been published yet, then the published row once it has', async () => {
        const beforePublish = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/site-settings`)
            .set('Host', site.domain);
        expect(beforePublish.status).toBe(200);
        expect(beforePublish.body).toBeNull();
        await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/site-settings?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({
            footerText: { en: 'Public footer', fa: 'فوتر عمومی' },
            contactEmail: 'hello@example.com',
            maintenanceMode: true,
        });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/site-settings/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const afterPublish = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/site-settings`)
            .set('Host', site.domain);
        expect(afterPublish.status).toBe(200);
        expect(afterPublish.body.footerText).toBe('Public footer');
        expect(afterPublish.body.contactEmail).toBe('hello@example.com');
        expect(afterPublish.body.maintenanceMode).toBe(true);
        const afterPublishFa = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/site-settings?locale=fa`)
            .set('Host', site.domain);
        expect(afterPublishFa.body.footerText).toBe('فوتر عمومی');
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/site-settings`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toBeNull();
    });
});
//# sourceMappingURL=cms-site-settings.e2e-spec.js.map