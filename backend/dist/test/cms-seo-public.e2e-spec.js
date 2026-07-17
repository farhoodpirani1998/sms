"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS SEO public routes (CMS-I.5 e2e)', () => {
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
    let site;
    let otherSite;
    beforeEach(async () => {
        await (0, test_app_1.truncateAll)(app);
        school = await (0, factories_1.createSchool)(app, { name: 'School A' });
        schoolAdmin = await (0, factories_1.createUser)(app, { role: factories_1.Role.SCHOOL_ADMIN, schoolId: school.id });
        site = await (0, factories_1.createSite)(app, {
            domain: `seo-e2e-${Date.now()}.example.com`,
            defaultLocale: 'en',
            supportedLocales: ['en'],
        });
        otherSite = await (0, factories_1.createSite)(app, {
            domain: `seo-e2e-other-${Date.now()}.example.com`,
        });
    });
    describe('GET /sitemap.xml', () => {
        it('resolves the Site from the Host header and returns a urlset with only that Site\'s published Pages/News', async () => {
            const home = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'home', title: { en: 'Home' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${home.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const article = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/news')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'science-fair-2026', title: { en: 'Science Fair' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/news/${article.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const draftPage = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'draft-page', title: { en: 'Draft' } });
            const otherPage = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: otherSite.id, slug: 'other-site-page', title: { en: 'Other Site Page' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${otherPage.body.id}/publish?siteId=${otherSite.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const res = await (0, supertest_1.default)(server).get('/api/v1/sitemap.xml').set('Host', site.domain);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/xml');
            expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            expect(res.text).toContain(`<loc>https://${site.domain}</loc>`);
            expect(res.text).not.toContain(`<loc>https://${site.domain}/home</loc>`);
            expect(res.text).toContain(`<loc>https://${site.domain}/news/science-fair-2026</loc>`);
            expect(res.text).not.toContain('draft-page');
            expect(res.text).not.toContain('other-site-page');
        });
        it('404s for a Host with no matching Site and no dev slug fallback', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/sitemap.xml')
                .set('Host', 'no-such-site.example.com');
            expect(res.status).toBe(404);
        });
    });
    describe('GET /robots.txt', () => {
        it('points crawlers at this Site\'s sitemap by default', async () => {
            const res = await (0, supertest_1.default)(server).get('/api/v1/robots.txt').set('Host', site.domain);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('text/plain');
            expect(res.text).toContain('User-agent: *');
            expect(res.text).toContain('Allow: /');
            expect(res.text).toContain(`Sitemap: https://${site.domain}/sitemap.xml`);
        });
        it('disallows every crawler when Site.seoDefaults.noIndex is set, scoped to that Site only', async () => {
            const noIndexSite = await (0, factories_1.createSite)(app, {
                domain: `seo-e2e-noindex-${Date.now()}.example.com`,
                seoDefaults: { noIndex: true },
            });
            const noIndexRes = await (0, supertest_1.default)(server)
                .get('/api/v1/robots.txt')
                .set('Host', noIndexSite.domain);
            expect(noIndexRes.status).toBe(200);
            expect(noIndexRes.text).toBe('User-agent: *\nDisallow: /\n');
            const normalRes = await (0, supertest_1.default)(server).get('/api/v1/robots.txt').set('Host', site.domain);
            expect(normalRes.text).toContain('Allow: /');
        });
    });
    describe('multi-site isolation', () => {
        it('serves distinct sitemaps for two Sites resolved by their own Host headers', async () => {
            const pageA = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: site.id, slug: 'about-a', title: { en: 'About A' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${pageA.body.id}/publish?siteId=${site.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const pageB = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/pages')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin))
                .send({ siteId: otherSite.id, slug: 'about-b', title: { en: 'About B' } });
            await (0, supertest_1.default)(server)
                .post(`/api/v1/cms/pages/${pageB.body.id}/publish?siteId=${otherSite.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdmin));
            const sitemapA = await (0, supertest_1.default)(server).get('/api/v1/sitemap.xml').set('Host', site.domain);
            const sitemapB = await (0, supertest_1.default)(server)
                .get('/api/v1/sitemap.xml')
                .set('Host', otherSite.domain);
            expect(sitemapA.text).toContain('about-a');
            expect(sitemapA.text).not.toContain('about-b');
            expect(sitemapB.text).toContain('about-b');
            expect(sitemapB.text).not.toContain('about-a');
        });
    });
});
//# sourceMappingURL=cms-seo-public.e2e-spec.js.map