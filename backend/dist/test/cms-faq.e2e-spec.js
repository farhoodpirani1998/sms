"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS FAQ (CMS-D.6 e2e)', () => {
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
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            siteId: site.id,
            question: { en: 'How do I apply?', fa: 'چگونه ثبت‌نام کنم؟' },
            answer: { en: 'Original answer' },
        });
        expect(createRes.status).toBe(201);
        const faqId = createRes.body.id;
        expect(createRes.body.siteId).toBe(site.id);
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/faq/${faqId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ answer: { en: 'Edited answer' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.answer).toEqual({ en: 'Edited answer' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/faq/${faqId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/faq/${faqId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        expect(publishRes.body.publishedAt).toBeDefined();
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/faq/${faqId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.answer).toEqual({ en: 'Original answer' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/faq/${faqId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.answer).toEqual({ en: 'Original answer' });
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, question: { en: 'Nope?' }, answer: { en: 'Nope' } });
        expect(res.status).toBe(403);
    });
    it('rejects a create missing the required answer field', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, question: { en: 'Missing answer?' } });
        expect(res.status).toBe(400);
    });
    it('reorders a real multi-row content type', async () => {
        const items = [];
        for (const label of ['First', 'Second', 'Third']) {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/faq')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, question: { en: label }, answer: { en: label } });
            items.push(res.body);
        }
        const reversedIds = [items[2].id, items[1].id, items[0].id];
        const reorderRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq/reorder')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, orderedIds: reversedIds });
        expect(reorderRes.status).toBe(201);
        const listRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/faq?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(listRes.body.data.map((f) => f.id)).toEqual(reversedIds);
    });
    it('scopes admin reads by siteId -- a faq from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, question: { en: 'Site A faq' }, answer: { en: 'Answer' } });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/faq/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    it('public endpoint returns only published rows, ordered, with no auth required', async () => {
        const draft = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, question: { en: 'Draft faq' }, answer: { en: 'Draft answer' } });
        const published = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({
            siteId: site.id,
            question: { en: 'Published faq', fa: 'سوال منتشر شده' },
            answer: { en: 'English answer' },
        });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/faq/${published.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const publicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/faq`)
            .set('Host', site.domain);
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toHaveLength(1);
        expect(publicRes.body[0].id).toBe(published.body.id);
        expect(publicRes.body[0].question).toBe('Published faq');
        expect(publicRes.body[0].answer).toBe('English answer');
        expect(publicRes.body[0].status).toBeUndefined();
        expect(publicRes.body.find((f) => f.id === draft.body.id)).toBeUndefined();
        const publicResBadLocale = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/faq?locale=de`)
            .set('Host', site.domain);
        expect(publicResBadLocale.body[0].question).toBe('Published faq');
        const publicResFa = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/faq?locale=fa`)
            .set('Host', site.domain);
        expect(publicResFa.body[0].question).toBe('سوال منتشر شده');
        expect(publicResFa.body[0].answer).toBe('English answer');
    });
    it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/faq')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, question: { en: 'Site A faq' }, answer: { en: 'Answer' } });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/faq/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/faq`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toHaveLength(0);
    });
});
//# sourceMappingURL=cms-faq.e2e-spec.js.map