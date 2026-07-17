"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS About (CMS-D.2 e2e)', () => {
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
            .post('/api/v1/cms/about')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            siteId: site.id,
            title: { en: 'About us', fa: 'درباره ما' },
            body: { en: 'Original body' },
        });
        expect(createRes.status).toBe(201);
        const aboutId = createRes.body.id;
        expect(createRes.body.siteId).toBe(site.id);
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/about/${aboutId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ body: { en: 'Edited body' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.body).toEqual({ en: 'Edited body' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/about/${aboutId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/about/${aboutId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        expect(publishRes.body.publishedAt).toBeDefined();
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/about/${aboutId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.body).toEqual({ en: 'Original body' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/about/${aboutId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.body).toEqual({ en: 'Original body' });
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/about')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, title: { en: 'Nope' } });
        expect(res.status).toBe(403);
    });
    it('reorders a real multi-row content type', async () => {
        const items = [];
        for (const label of ['First', 'Second', 'Third']) {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/about')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, title: { en: label } });
            items.push(res.body);
        }
        const reversedIds = [items[2].id, items[1].id, items[0].id];
        const reorderRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/about/reorder')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, orderedIds: reversedIds });
        expect(reorderRes.status).toBe(201);
        const listRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/about?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(listRes.body.data.map((a) => a.id)).toEqual(reversedIds);
    });
    it('scopes admin reads by siteId -- an about item from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/about')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, title: { en: 'Site A about' } });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/about/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    it('public endpoint returns only published rows, ordered, with no auth required', async () => {
        const draft = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/about')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, title: { en: 'Draft about' } });
        const published = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/about')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({
            siteId: site.id,
            title: { en: 'Published about', fa: 'درباره منتشر شده' },
            body: { en: 'English body' },
        });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/about/${published.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const publicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/about`)
            .set('Host', site.domain);
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toHaveLength(1);
        expect(publicRes.body[0].id).toBe(published.body.id);
        expect(publicRes.body[0].title).toBe('Published about');
        expect(publicRes.body[0].status).toBeUndefined();
        expect(publicRes.body.find((a) => a.id === draft.body.id)).toBeUndefined();
        const publicResBadLocale = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/about?locale=de`)
            .set('Host', site.domain);
        expect(publicResBadLocale.body[0].title).toBe('Published about');
        const publicResFa = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/about?locale=fa`)
            .set('Host', site.domain);
        expect(publicResFa.body[0].title).toBe('درباره منتشر شده');
        expect(publicResFa.body[0].body).toBe('English body');
    });
    it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/about')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, title: { en: 'Site A about' } });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/about/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/about`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toHaveLength(0);
    });
});
//# sourceMappingURL=cms-about.e2e-spec.js.map