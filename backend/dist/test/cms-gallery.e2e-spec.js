"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS Gallery (CMS-H.1 e2e)', () => {
    let app;
    let server;
    let mediaTmpDir;
    beforeAll(async () => {
        mediaTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-gallery-e2e-'));
        process.env.MEDIA_STORAGE_DRIVER = 'local';
        process.env.MEDIA_LOCAL_PATH = mediaTmpDir;
        app = await (0, test_app_1.createTestApp)();
        server = app.getHttpServer();
    });
    afterAll(async () => {
        await (0, test_app_1.closeTestApp)(app);
        await fs.rm(mediaTmpDir, { recursive: true, force: true });
        delete process.env.MEDIA_STORAGE_DRIVER;
        delete process.env.MEDIA_LOCAL_PATH;
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
    async function uploadMedia(forSite = site, filename = 'photo.jpg') {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/media')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .field('siteId', forSite.id)
            .attach('file', Buffer.from(`fake-bytes-${filename}`), {
            filename,
            contentType: 'image/jpeg',
        });
        expect(res.status).toBe(201);
        return res.body;
    }
    it('runs the full create -> edit -> publish -> revision-restore round trip with a real uploaded media reference', async () => {
        const media = await uploadMedia();
        const createRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            siteId: site.id,
            mediaId: media.id,
            caption: { en: 'Sports day', fa: 'روز ورزش' },
            category: 'sports',
        });
        expect(createRes.status).toBe(201);
        const itemId = createRes.body.id;
        expect(createRes.body.mediaId).toBe(media.id);
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/gallery/${itemId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ caption: { en: 'Edited caption' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.caption).toEqual({ en: 'Edited caption' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${itemId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${itemId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/gallery/${itemId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.caption).toEqual({ en: 'Sports day', fa: 'روز ورزش' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${itemId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.caption).toEqual({ en: 'Sports day', fa: 'روز ورزش' });
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const media = await uploadMedia();
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, mediaId: media.id });
        expect(res.status).toBe(403);
    });
    it('requires mediaId on create -- unlike every optional coverMediaId elsewhere in the module', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, caption: { en: 'No media' } });
        expect(res.status).toBe(400);
    });
    it('reorders a real multi-row content type', async () => {
        const items = [];
        for (const label of ['First', 'Second', 'Third']) {
            const media = await uploadMedia(site, `${label}.jpg`);
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/gallery')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, mediaId: media.id, caption: { en: label } });
            items.push(res.body);
        }
        const reversedIds = [items[2].id, items[1].id, items[0].id];
        const reorderRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery/reorder')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, orderedIds: reversedIds });
        expect(reorderRes.status).toBe(201);
        const listRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/gallery?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(listRes.body.data.map((g) => g.id)).toEqual(reversedIds);
    });
    it('scopes admin reads by siteId -- a gallery item from another Site 404s', async () => {
        const media = await uploadMedia();
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, mediaId: media.id });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/gallery/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    it('public endpoint returns only published rows, ordered, localized, resolving the real media URL', async () => {
        const media = await uploadMedia(site, 'sports-day.jpg');
        const draft = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, mediaId: media.id, caption: { en: 'Draft item' } });
        const published = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({
            siteId: site.id,
            mediaId: media.id,
            caption: { en: 'Sports day', fa: 'روز ورزش' },
            category: 'sports',
        });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${published.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const publicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/gallery`)
            .set('Host', site.domain);
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toHaveLength(1);
        expect(publicRes.body[0].id).toBe(published.body.id);
        expect(publicRes.body[0].caption).toBe('Sports day');
        expect(publicRes.body[0].mediaUrl).toBe(media.url);
        expect(publicRes.body[0].category).toBe('sports');
        expect(publicRes.body.find((g) => g.id === draft.body.id)).toBeUndefined();
        const publicResFa = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/gallery?locale=fa`)
            .set('Host', site.domain);
        expect(publicResFa.body[0].caption).toBe('روز ورزش');
    });
    it('filters both admin and public listings by category', async () => {
        const media = await uploadMedia();
        const sports = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, mediaId: media.id, category: 'sports' });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${sports.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const campusLife = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, mediaId: media.id, category: 'campus-life' });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${campusLife.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const adminFiltered = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/gallery?siteId=${site.id}&category=sports`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(adminFiltered.body.data.map((g) => g.id)).toEqual([sports.body.id]);
        const publicFiltered = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/gallery?category=campus-life`)
            .set('Host', site.domain);
        expect(publicFiltered.body.map((g) => g.id)).toEqual([campusLife.body.id]);
    });
    it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
        const media = await uploadMedia();
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/gallery')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, mediaId: media.id });
        await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/gallery/${created.body.id}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        const otherSitePublicRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/public/gallery`)
            .set('Host', otherSite.domain);
        expect(otherSitePublicRes.status).toBe(200);
        expect(otherSitePublicRes.body).toHaveLength(0);
    });
});
//# sourceMappingURL=cms-gallery.e2e-spec.js.map