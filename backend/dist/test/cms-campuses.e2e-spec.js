"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS Campuses (CMS-H.4 e2e)', () => {
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
    it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            siteId: site.id,
            name: { en: 'Main Campus', fa: 'کمپوس اصلی' },
            address: { en: '123 Original Street' },
            description: { en: 'Original description' },
        });
        expect(createRes.status).toBe(201);
        const campusId = createRes.body.id;
        expect(createRes.body.name).toEqual({ en: 'Main Campus', fa: 'کمپوس اصلی' });
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/campuses/${campusId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ description: { en: 'Edited description' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.description).toEqual({ en: 'Edited description' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/campuses/${campusId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/campuses/${campusId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/campuses/${campusId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.description).toEqual({ en: 'Original description' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/campuses/${campusId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.description).toEqual({ en: 'Original description' });
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, name: { en: 'Nobody Campus' } });
        expect(res.status).toBe(403);
    });
    it('requires a name', async () => {
        const missingName = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, address: { en: 'No name here' } });
        expect(missingName.status).toBe(400);
        const withName = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, name: { en: 'Valid Campus' } });
        expect(withName.status).toBe(201);
        expect(withName.body.name).toEqual({ en: 'Valid Campus' });
    });
    it('reorders a real multi-row content type', async () => {
        const items = [];
        for (const name of ['Campus One', 'Campus Two', 'Campus Three']) {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/campuses')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, name: { en: name } });
            items.push(res.body);
        }
        const reversedIds = [items[2].id, items[1].id, items[0].id];
        const reorderRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses/reorder')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, orderedIds: reversedIds });
        expect(reorderRes.status).toBe(201);
        const listRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/campuses?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(listRes.body.data.map((c) => c.id)).toEqual(reversedIds);
    });
    it('scopes admin reads by siteId -- a campus from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, name: { en: 'Site A Campus' } });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/campuses/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    it('public endpoint returns only published rows, ordered, localized, with no auth required', async () => {
        const draft = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, name: { en: 'Draft Campus' } });
        const published = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({
            siteId: site.id,
            name: { en: 'Published Campus', fa: 'کمپوس منتشر شده' },
            address: { en: 'English Address' },
            description: { en: 'English description' },
        });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/campuses/${published.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const publicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/campuses`)
            .set('Host', site.domain);
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toHaveLength(1);
        expect(publicRes.body[0].id).toBe(published.body.id);
        expect(publicRes.body[0].name).toBe('Published Campus');
        expect(publicRes.body[0].address).toBe('English Address');
        expect(publicRes.body[0].status).toBeUndefined();
        expect(publicRes.body.find((c) => c.id === draft.body.id)).toBeUndefined();
        const publicResFa = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/campuses?locale=fa`)
            .set('Host', site.domain);
        expect(publicResFa.body[0].name).toBe('کمپوس منتشر شده');
        expect(publicResFa.body[0].description).toBe('English description');
    });
    it('public endpoint resolves the Site from the Host header -- another Site never sees these items', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/campuses')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, name: { en: 'Site A Campus' } });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/campuses/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/campuses`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toHaveLength(0);
        const unknownHostRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/campuses`)
            .set('Host', 'no-such-site.example.com');
        expect(unknownHostRes.status).toBe(404);
    });
});
//# sourceMappingURL=cms-campuses.e2e-spec.js.map