"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS Testimonials (CMS-H.2 e2e)', () => {
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
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
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
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/testimonials/${testimonialId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ quote: { en: 'Edited quote' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.quote).toEqual({ en: 'Edited quote' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/testimonials/${testimonialId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/testimonials/${testimonialId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/testimonials/${testimonialId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.quote).toEqual({ en: 'Original quote', fa: 'نقل قول اصلی' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/testimonials/${testimonialId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.quote).toEqual({ en: 'Original quote', fa: 'نقل قول اصلی' });
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, quote: { en: 'Nope' }, authorName: 'Nobody' });
        expect(res.status).toBe(403);
    });
    it('rejects a rating outside the 1-5 range', async () => {
        const tooHigh = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, quote: { en: 'Great school' }, authorName: 'Jane', rating: 6 });
        expect(tooHigh.status).toBe(400);
        const tooLow = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, quote: { en: 'Great school' }, authorName: 'Jane', rating: 0 });
        expect(tooLow.status).toBe(400);
    });
    it('reorders a real multi-row content type', async () => {
        const items = [];
        for (const name of ['First Parent', 'Second Parent', 'Third Parent']) {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/testimonials')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, quote: { en: 'A quote' }, authorName: name });
            items.push(res.body);
        }
        const reversedIds = [items[2].id, items[1].id, items[0].id];
        const reorderRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials/reorder')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, orderedIds: reversedIds });
        expect(reorderRes.status).toBe(201);
        const listRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/testimonials?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(listRes.body.data.map((t) => t.id)).toEqual(reversedIds);
    });
    it('scopes admin reads by siteId -- a testimonial from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, quote: { en: 'Site A quote' }, authorName: 'Jane' });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/testimonials/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    it('public endpoint returns only published rows, ordered, with no auth required and no avatar when none is set', async () => {
        const draft = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, quote: { en: 'Draft quote' }, authorName: 'Draft Author' });
        const published = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({
            siteId: site.id,
            quote: { en: 'Published quote', fa: 'نقل قول منتشر شده' },
            authorName: 'Published Author',
            authorRole: { en: 'Parent' },
            rating: 4,
        });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/testimonials/${published.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const publicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/testimonials`)
            .set('Host', site.domain);
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toHaveLength(1);
        expect(publicRes.body[0].id).toBe(published.body.id);
        expect(publicRes.body[0].quote).toBe('Published quote');
        expect(publicRes.body[0].authorName).toBe('Published Author');
        expect(publicRes.body[0].rating).toBe(4);
        expect(publicRes.body[0].avatarUrl).toBeNull();
        expect(publicRes.body[0].status).toBeUndefined();
        expect(publicRes.body.find((t) => t.id === draft.body.id)).toBeUndefined();
        const publicResFa = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/testimonials?locale=fa`)
            .set('Host', site.domain);
        expect(publicResFa.body[0].quote).toBe('نقل قول منتشر شده');
    });
    it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/testimonials')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, quote: { en: 'Site A quote' }, authorName: 'Jane' });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/testimonials/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/testimonials`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toHaveLength(0);
    });
});
//# sourceMappingURL=cms-testimonials.e2e-spec.js.map