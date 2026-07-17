"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const locale_resolver_service_1 = require("./locale-resolver.service");
function fakeSiteService(site) {
    return {
        findOne: jest.fn().mockResolvedValue(site),
    };
}
describe('LocaleResolverService', () => {
    describe('resolve', () => {
        it('returns the requested locale when the Site supports it', async () => {
            const siteService = fakeSiteService({ defaultLocale: 'en', supportedLocales: ['en', 'fa'] });
            const service = new locale_resolver_service_1.LocaleResolverService(siteService);
            await expect(service.resolve('site-1', 'fa')).resolves.toBe('fa');
        });
        it('falls back to the Site defaultLocale when the requested locale is unsupported', async () => {
            const siteService = fakeSiteService({ defaultLocale: 'en', supportedLocales: ['en'] });
            const service = new locale_resolver_service_1.LocaleResolverService(siteService);
            await expect(service.resolve('site-1', 'fa')).resolves.toBe('en');
        });
        it('falls back to the Site defaultLocale when no locale is requested', async () => {
            const siteService = fakeSiteService({ defaultLocale: 'en', supportedLocales: ['en', 'fa'] });
            const service = new locale_resolver_service_1.LocaleResolverService(siteService);
            await expect(service.resolve('site-1')).resolves.toBe('en');
        });
    });
    describe('resolveText', () => {
        const siteService = fakeSiteService({ defaultLocale: 'en', supportedLocales: ['en', 'fa'] });
        const service = new locale_resolver_service_1.LocaleResolverService(siteService);
        it('returns the requested locale entry when present', () => {
            expect(service.resolveText({ en: 'Hello', fa: 'سلام' }, 'fa', 'en')).toBe('سلام');
        });
        it('falls back to the default locale entry when the requested one is missing', () => {
            expect(service.resolveText({ en: 'Hello' }, 'fa', 'en')).toBe('Hello');
        });
        it('falls back to any available entry when neither requested nor default locale exist', () => {
            expect(service.resolveText({ de: 'Hallo' }, 'fa', 'en')).toBe('Hallo');
        });
        it('returns null for an empty or missing column', () => {
            expect(service.resolveText(null, 'fa', 'en')).toBeNull();
            expect(service.resolveText({}, 'fa', 'en')).toBeNull();
        });
    });
});
//# sourceMappingURL=locale-resolver.service.spec.js.map