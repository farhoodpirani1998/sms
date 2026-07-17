"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const public_site_context_guard_1 = require("./public-site-context.guard");
function fakeSite() {
    return {
        id: 'site-1',
        name: 'NHG',
        domain: 'nhg.example.com',
        defaultLocale: 'en',
        supportedLocales: ['en'],
        theme: null,
        socialLinks: null,
        seoDefaults: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
function fakeContext(request) {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    };
}
describe('PublicSiteContextGuard', () => {
    it('resolves the Site from the Host header and attaches it to the request', async () => {
        const site = fakeSite();
        const resolver = { resolveFromHost: jest.fn().mockResolvedValue(site) };
        const guard = new public_site_context_guard_1.PublicSiteContextGuard(resolver);
        const request = { headers: { host: 'nhg.example.com' }, query: {} };
        const result = await guard.canActivate(fakeContext(request));
        expect(result).toBe(true);
        expect(request.cmsSite).toBe(site);
        expect(resolver.resolveFromHost).toHaveBeenCalledWith('nhg.example.com', undefined);
    });
    it('passes a dev slug from the query param through to the resolver', async () => {
        const site = fakeSite();
        const resolver = { resolveFromHost: jest.fn().mockResolvedValue(site) };
        const guard = new public_site_context_guard_1.PublicSiteContextGuard(resolver);
        const request = { headers: { host: 'localhost:3000' }, query: { site: 'nhg' } };
        await guard.canActivate(fakeContext(request));
        expect(resolver.resolveFromHost).toHaveBeenCalledWith('localhost:3000', 'nhg');
    });
    it('passes a dev slug from the X-Cms-Site-Slug header when there is no query param', async () => {
        const site = fakeSite();
        const resolver = { resolveFromHost: jest.fn().mockResolvedValue(site) };
        const guard = new public_site_context_guard_1.PublicSiteContextGuard(resolver);
        const request = {
            headers: { host: 'localhost:3000', 'x-cms-site-slug': 'nhg' },
            query: {},
        };
        await guard.canActivate(fakeContext(request));
        expect(resolver.resolveFromHost).toHaveBeenCalledWith('localhost:3000', 'nhg');
    });
    it('propagates the resolver rejection when no Site can be resolved', async () => {
        const resolver = {
            resolveFromHost: jest.fn().mockRejectedValue(new Error('no site')),
        };
        const guard = new public_site_context_guard_1.PublicSiteContextGuard(resolver);
        const request = { headers: {}, query: {} };
        await expect(guard.canActivate(fakeContext(request))).rejects.toThrow('no site');
        expect(request.cmsSite).toBeUndefined();
    });
});
//# sourceMappingURL=public-site-context.guard.spec.js.map