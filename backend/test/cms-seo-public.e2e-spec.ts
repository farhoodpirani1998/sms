import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-I.5: `SeoPublicController` -- the actual `GET /sitemap.xml` /
 * `GET /robots.txt` HTTP routes wrapping `SitemapService`/`RobotsService`
 * (already unit-proven directly via `app.get()` in `cms-pages.e2e-spec.ts`
 * and CMS-G.2's News suite). This spec exercises the routes end to end:
 * Host-header Site resolution (`PublicSiteContextGuard`, CMS-I.1),
 * `noIndex` opt-out (`RobotsService`), and per-Site isolation -- neither
 * route declares a `cms/` prefix (see the controller's own doc comment),
 * so requests go straight to `/api/v1/sitemap.xml` / `/api/v1/robots.txt`.
 */
describe('CMS SEO public routes (CMS-I.5 e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  let school: Awaited<ReturnType<typeof createSchool>>;
  let schoolAdmin: Awaited<ReturnType<typeof createUser>>;
  let site: Awaited<ReturnType<typeof createSite>>;
  let otherSite: Awaited<ReturnType<typeof createSite>>;

  beforeEach(async () => {
    await truncateAll(app);

    school = await createSchool(app, { name: 'School A' });
    schoolAdmin = await createUser(app, { role: Role.SCHOOL_ADMIN, schoolId: school.id });

    site = await createSite(app, {
      domain: `seo-e2e-${Date.now()}.example.com`,
      defaultLocale: 'en',
      supportedLocales: ['en'],
    } as any);
    otherSite = await createSite(app, {
      domain: `seo-e2e-other-${Date.now()}.example.com`,
    } as any);
  });

  describe('GET /sitemap.xml', () => {
    it('resolves the Site from the Host header and returns a urlset with only that Site\'s published Pages/News', async () => {
      const home = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'home', title: { en: 'Home' } });
      await request(server)
        .post(`/api/v1/cms/pages/${home.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const article = await request(server)
        .post('/api/v1/cms/news')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'science-fair-2026', title: { en: 'Science Fair' } });
      await request(server)
        .post(`/api/v1/cms/news/${article.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      // Draft page -- must not appear.
      const draftPage = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'draft-page', title: { en: 'Draft' } });

      // Published page on the other Site -- must not leak across.
      const otherPage = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: otherSite.id, slug: 'other-site-page', title: { en: 'Other Site Page' } });
      await request(server)
        .post(`/api/v1/cms/pages/${otherPage.body.id}/publish?siteId=${otherSite.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const res = await request(server).get('/api/v1/sitemap.xml').set('Host', site.domain);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

      // "home" slug canonicalizes to the bare domain, not "/home".
      expect(res.text).toContain(`<loc>https://${site.domain}</loc>`);
      expect(res.text).not.toContain(`<loc>https://${site.domain}/home</loc>`);
      expect(res.text).toContain(`<loc>https://${site.domain}/news/science-fair-2026</loc>`);

      expect(res.text).not.toContain('draft-page');
      expect(res.text).not.toContain('other-site-page');
    });

    it('404s for a Host with no matching Site and no dev slug fallback', async () => {
      const res = await request(server)
        .get('/api/v1/sitemap.xml')
        .set('Host', 'no-such-site.example.com');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /robots.txt', () => {
    it('points crawlers at this Site\'s sitemap by default', async () => {
      const res = await request(server).get('/api/v1/robots.txt').set('Host', site.domain);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('User-agent: *');
      expect(res.text).toContain('Allow: /');
      expect(res.text).toContain(`Sitemap: https://${site.domain}/sitemap.xml`);
    });

    it('disallows every crawler when Site.seoDefaults.noIndex is set, scoped to that Site only', async () => {
      const noIndexSite = await createSite(app, {
        domain: `seo-e2e-noindex-${Date.now()}.example.com`,
        seoDefaults: { noIndex: true },
      } as any);

      const noIndexRes = await request(server)
        .get('/api/v1/robots.txt')
        .set('Host', noIndexSite.domain);

      expect(noIndexRes.status).toBe(200);
      expect(noIndexRes.text).toBe('User-agent: *\nDisallow: /\n');

      // The original Site (no noIndex set) is unaffected.
      const normalRes = await request(server).get('/api/v1/robots.txt').set('Host', site.domain);
      expect(normalRes.text).toContain('Allow: /');
    });
  });

  describe('multi-site isolation', () => {
    it('serves distinct sitemaps for two Sites resolved by their own Host headers', async () => {
      const pageA = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, slug: 'about-a', title: { en: 'About A' } });
      await request(server)
        .post(`/api/v1/cms/pages/${pageA.body.id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const pageB = await request(server)
        .post('/api/v1/cms/pages')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: otherSite.id, slug: 'about-b', title: { en: 'About B' } });
      await request(server)
        .post(`/api/v1/cms/pages/${pageB.body.id}/publish?siteId=${otherSite.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));

      const sitemapA = await request(server).get('/api/v1/sitemap.xml').set('Host', site.domain);
      const sitemapB = await request(server)
        .get('/api/v1/sitemap.xml')
        .set('Host', otherSite.domain);

      expect(sitemapA.text).toContain('about-a');
      expect(sitemapA.text).not.toContain('about-b');

      expect(sitemapB.text).toContain('about-b');
      expect(sitemapB.text).not.toContain('about-a');
    });
  });
});
