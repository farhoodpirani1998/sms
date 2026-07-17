"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS Proof Block (CMS-C.5 e2e)', () => {
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
        site = await (0, factories_1.createSite)(app);
        otherSite = await (0, factories_1.createSite)(app);
    });
    it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/proof-blocks')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ siteId: site.id, title: { en: 'Original title' } });
        expect(createRes.status).toBe(201);
        const blockId = createRes.body.id;
        expect(createRes.body.siteId).toBe(site.id);
        expect(createRes.body.title).toEqual({ en: 'Original title' });
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/proof-blocks/${blockId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ title: { en: 'Edited title' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.title).toEqual({ en: 'Edited title' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/proof-blocks/${blockId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/proof-blocks/${blockId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        expect(publishRes.body.publishedAt).toBeDefined();
        const revisionsAfterPublish = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/proof_block/${blockId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsAfterPublish.status).toBe(200);
        expect(revisionsAfterPublish.body.length).toBe(3);
        const originalRevision = revisionsAfterPublish.body[revisionsAfterPublish.body.length - 1];
        expect(originalRevision.snapshot.title).toEqual({ en: 'Original title' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/proof-blocks/${blockId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.title).toEqual({ en: 'Original title' });
        expect(restoreRes.body.status).toBe('published');
        const revisionsAfterRestore = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/proof_block/${blockId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsAfterRestore.body.length).toBe(4);
        const finalGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/proof-blocks/${blockId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(finalGet.body.title).toEqual({ en: 'Original title' });
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/proof-blocks')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, title: { en: 'Nope' } });
        expect(res.status).toBe(403);
    });
    it('unpublishes back to draft', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/proof-blocks')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, title: { en: 'Block' } });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/proof-blocks/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const unpublishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/proof-blocks/${created.body.id}/unpublish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(unpublishRes.status).toBe(201);
        expect(unpublishRes.body.status).toBe('draft');
        expect(unpublishRes.body.publishedAt).toBeNull();
    });
    it('reorders a real multi-row content type', async () => {
        const blocks = [];
        for (const title of ['First', 'Second', 'Third']) {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/proof-blocks')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, title: { en: title } });
            blocks.push(res.body);
        }
        const reversedIds = [blocks[2].id, blocks[1].id, blocks[0].id];
        const reorderRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/proof-blocks/reorder')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, orderedIds: reversedIds });
        expect(reorderRes.status).toBe(201);
        const listRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/proof-blocks?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const listedIds = listRes.body.data.map((b) => b.id);
        expect(listedIds).toEqual(reversedIds);
    });
    it('scopes every read/write by siteId -- a block from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/proof-blocks')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, title: { en: 'Site A block' } });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/proof-blocks/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    it('deletes a block and emits the deletion event without error', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/proof-blocks')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, title: { en: 'Doomed block' } });
        const deleteRes = await (0, supertest_1.default)(server)
            .delete(`/api/v1/cms/proof-blocks/${created.body.id}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(deleteRes.status).toBe(200);
        const getAfterDelete = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/proof-blocks/${created.body.id}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(getAfterDelete.status).toBe(404);
    });
});
//# sourceMappingURL=cms-proof-block.e2e-spec.js.map