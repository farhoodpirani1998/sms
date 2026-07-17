"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
const sitemap_service_1 = require("../src/modules/cms/core/seo/sitemap.service");
describe('CMS Pages (CMS-F.1/F.2 e2e)', () => {
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
            domain: `pages-e2e-${Date.now()}.example.com`,
            defaultLocale: 'en',
            supportedLocales: ['en', 'fa'],
            seoDefaults: { title: { en: 'Site default title' }, description: { en: 'Site default description' } },
        });
        otherSite = await (0, factories_1.createSite)(app);
    });
    it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({
            siteId: site.id,
            slug: 'admissions',
            title: { en: 'Admissions', fa: 'ثبت‌نام' },
            body: { en: 'Original body' },
        });
        expect(createRes.status).toBe(201);
        const pageId = createRes.body.id;
        expect(createRes.body.slug).toBe('admissions');
        expect(createRes.body.status).toBe('draft');
        const updateRes = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/pages/${pageId}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff))
            .send({ body: { en: 'Edited body' } });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.body).toEqual({ en: 'Edited body' });
        const staffPublishAttempt = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/pages/${pageId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, staff));
        expect(staffPublishAttempt.status).toBe(403);
        const publishRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/pages/${pageId}/publish?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(publishRes.status).toBe(201);
        expect(publishRes.body.status).toBe('published');
        expect(publishRes.body.publishedAt).toBeDefined();
        const revisionsRes = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/pages/${pageId}/revisions`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(revisionsRes.status).toBe(200);
        expect(revisionsRes.body.length).toBe(3);
        const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
        expect(originalRevision.snapshot.body).toEqual({ en: 'Original body' });
        const restoreRes = await (0, supertest_1.default)(server)
            .post(`/api/v1/cms/pages/${pageId}/restore?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ revisionId: originalRevision.id });
        expect(restoreRes.status).toBe(201);
        expect(restoreRes.body.body).toEqual({ en: 'Original body' });
        expect(restoreRes.body.status).toBe('published');
    });
    it('rejects accountant (no CMS permissions at all)', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, accountant))
            .send({ siteId: site.id, slug: 'nope', title: { en: 'Nope' } });
        expect(res.status).toBe(403);
    });
    it('rejects a malformed slug', async () => {
        const res = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, slug: 'Not A Slug!', title: { en: 'Bad slug' } });
        expect(res.status).toBe(400);
    });
    it('rejects a duplicate slug within the same Site with a 409, but allows it on another Site', async () => {
        const first = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, slug: 'about-us', title: { en: 'About us' } });
        expect(first.status).toBe(201);
        const duplicate = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, slug: 'about-us', title: { en: 'About us again' } });
        expect(duplicate.status).toBe(409);
        const otherSitePage = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: otherSite.id, slug: 'about-us', title: { en: 'About us (other site)' } });
        expect(otherSitePage.status).toBe(201);
        const rename = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, slug: 'contact', title: { en: 'Contact' } });
        expect(rename.status).toBe(201);
        const renameToTaken = await (0, supertest_1.default)(server)
            .patch(`/api/v1/cms/pages/${rename.body.id}?siteId=${site.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ slug: 'about-us' });
        expect(renameToTaken.status).toBe(409);
    });
    it('scopes admin reads by siteId -- a page from another Site 404s', async () => {
        const created = await (0, supertest_1.default)(server)
            .post('/api/v1/cms/pages')
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
            .send({ siteId: site.id, slug: 'site-a-page', title: { en: 'Site A page' } });
        const crossSiteGet = await (0, supertest_1.default)(server)
            .get(`/api/v1/cms/pages/${created.body.id}?siteId=${otherSite.id}`)
            .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
        expect(crossSiteGet.status).toBe(404);
    });
    describe('public by-slug read (CMS-F.2)', () => {
        it('resolves a published Page by slug, localized, with its own SEO fields', async () => {
            const draft = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'draft-page', title: { en: 'Draft page' } });
            const published = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({
                siteId: site.id,
                slug: 'admissions',
                title: { en: 'Admissions', fa: 'ثبت‌نام' },
                excerpt: { en: 'How to apply' },
                body: { en: 'Full admissions body' },
                metaTitle: { en: 'Admissions | Our School' },
                metaDescription: { en: 'Learn how to apply.' },
            });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${published.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const notFound = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/pages/does-not-exist`)
                .set('Host', site.domain);
            expect(notFound.status).toBe(404);
            const draftFetch = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/pages/draft-page`)
                .set('Host', site.domain);
            expect(draftFetch.status).toBe(404);
            const publicRes = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/pages/admissions`)
                .set('Host', site.domain);
            expect(publicRes.status).toBe(200);
            expect(publicRes.body.id).toBe(published.body.id);
            expect(publicRes.body.title).toBe('Admissions');
            expect(publicRes.body.excerpt).toBe('How to apply');
            expect(publicRes.body.seo.title).toBe('Admissions | Our School');
            expect(publicRes.body.seo.description).toBe('Learn how to apply.');
            expect(publicRes.body.seo.canonicalUrl).toBe(`https://${site.domain}/admissions`);
            const publicResFa = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/pages/admissions?locale=fa`)
                .set('Host', site.domain);
            expect(publicResFa.body.title).toBe('ثبت‌نام');
            expect(draft.body.id).not.toBe(published.body.id);
        });
        it('falls back to the Page title and then Site.seoDefaults when a Page has no SEO fields of its own', async () => {
            const published = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'no-seo', title: { en: 'No SEO fields here' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${published.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const publicRes = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/pages/no-seo`)
                .set('Host', site.domain);
            expect(publicRes.status).toBe(200);
            expect(publicRes.body.seo.title).toBe('No SEO fields here');
            expect(publicRes.body.seo.description).toBe('Site default description');
        });
        it('scopes the public by-slug read by siteId -- another Site never resolves this slug', async () => {
            const published = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'shared-slug', title: { en: 'Site A page' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${published.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const otherSiteRes = await (0, supertest_1.default)(server)
                .get(`/api/v1/public/pages/shared-slug`)
                .set('Host', otherSite.domain);
            expect(otherSiteRes.status).toBe(404);
        });
    });
    describe('sitemap generation (CMS-F.2)', () => {
        it('includes every published Page for the Site, root-cased for the "home" slug, and excludes drafts and other Sites', async () => {
            const home = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'home', title: { en: 'Home' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${home.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const admissions = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'admissions', title: { en: 'Admissions' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${admissions.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'unpublished-draft', title: { en: 'Draft' } });
            const otherPage = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: otherSite.id, slug: 'other-site-page', title: { en: 'Other site page' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${otherPage.body.id}/publish?siteId=${otherSite.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const sitemapService = app.get(sitemap_service_1.SitemapService);
            const xml = await sitemapService.generate(site.id);
            expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            expect(xml).toContain(`<loc>https://${site.domain}</loc>`);
            expect(xml).not.toContain(`<loc>https://${site.domain}/home</loc>`);
            expect(xml).toContain(`<loc>https://${site.domain}/admissions</loc>`);
            expect(xml).not.toContain('unpublished-draft');
            expect(xml).not.toContain('other-site-page');
        });
    });
});
//# sourceMappingURL=cms-pages.e2e-spec.js.map