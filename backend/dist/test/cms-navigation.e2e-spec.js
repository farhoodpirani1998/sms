"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS Navigation (CMS-E.2 e2e)', () => {
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
    it('runs the full create -> edit -> publish -> revision-restore round trip on a top-level item', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/navigation')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            siteId: site.id,
            label: { en: 'Admissions', fa: 'ثبت‌نام' },
            url: '/admissions',
        });
        expect(createRes.status).toBe(201);
        const itemId = createRes.body.id;
        expect(createRes.body.siteId).toBe(site.id);
        expect(createRes.body.parentId).toBeNull();
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/navigation/${itemId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ url: '/admissions/apply' });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.url).toBe('/admissions/apply');
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/navigation/${itemId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/navigation/${itemId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        expect(publishRes.body.publishedAt).toBeDefined();
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/navigation/${itemId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.url).toBe('/admissions');
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/navigation/${itemId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.url).toBe('/admissions');
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/navigation')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, label: { en: 'Nope' } });
        expect(res.status).toBe(403);
    });
    it('scopes admin reads by siteId -- a navigation item from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/navigation')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, label: { en: 'Site A item' } });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/navigation/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    describe('2-level tree assembly + per-parent ordering (CMS-E.2)', () => {
        async function createItem(label, opts = {}) {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/navigation')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, label: { en: label }, ...opts });
            return res.body;
        }
        async function publish(id) {
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/navigation/${id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        }
        it('builds a correctly nested, correctly ordered 2-level tree via the public endpoint', async () => {
            const about = await createItem('About', { url: '/about' });
            const programs = await createItem('Programs', { url: '/programs' });
            const contact = await createItem('Contact', { url: '/contact' });
            const elementary = await createItem('Elementary', {
                parentId: programs.id,
                url: '/programs/elementary',
            });
            const highSchool = await createItem('High School', {
                parentId: programs.id,
                url: '/programs/high-school',
            });
            for (const item of [about, programs, contact, elementary, highSchool]) {
                await publish(item.id);
            }
            const reorderTopLevel = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/navigation/reorder')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, orderedIds: [programs.id, about.id, contact.id] });
            expect(reorderTopLevel.status).toBe(201);
            const reorderChildren = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/navigation/reorder')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({
                siteId: site.id,
                parentId: programs.id,
                orderedIds: [highSchool.id, elementary.id],
            });
            expect(reorderChildren.status).toBe(201);
            const publicRes = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/navigation`)
                .set('Host', site.domain);
            expect(publicRes.status).toBe(200);
            expect(publicRes.body).toHaveLength(3);
            expect(publicRes.body.map((n) => n.label)).toEqual(['Programs', 'About', 'Contact']);
            const programsNode = publicRes.body.find((n) => n.label === 'Programs');
            expect(programsNode.children).toHaveLength(2);
            expect(programsNode.children.map((c) => c.label)).toEqual(['High School', 'Elementary']);
            expect(programsNode.children[0].url).toBe('/programs/high-school');
            const aboutNode = publicRes.body.find((n) => n.label === 'About');
            expect(aboutNode.children).toEqual([]);
            expect(programsNode.children[0].children).toEqual([]);
        });
        it('rejects a reorder that mixes ids from different parent scopes', async () => {
            const programs = await createItem('Programs');
            const contact = await createItem('Contact');
            const elementary = await createItem('Elementary', { parentId: programs.id });
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/navigation/reorder')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, parentId: programs.id, orderedIds: [elementary.id, contact.id] });
            expect(res.status).toBe(400);
        });
        it('reparents an item to a new parent, and rejects moving an item under its own descendant', async () => {
            const programs = await createItem('Programs');
            const admissions = await createItem('Admissions');
            const elementary = await createItem('Elementary', { parentId: programs.id });
            const reparentRes = await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/navigation/${admissions.id}/reparent`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, parentId: programs.id });
            expect(reparentRes.status).toBe(201);
            expect(reparentRes.body.parentId).toBe(programs.id);
            const cycleRes = await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/navigation/${programs.id}/reparent`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, parentId: elementary.id });
            expect(cycleRes.status).toBe(400);
        });
    });
    it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/navigation')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, label: { en: 'Site A item' } });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/navigation/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/navigation`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toEqual([]);
    });
});
//# sourceMappingURL=cms-navigation.e2e-spec.js.map