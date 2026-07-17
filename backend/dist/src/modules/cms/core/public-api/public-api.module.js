"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiModule = void 0;
const common_1 = require("@nestjs/common");
const site_module_1 = require("../site/site.module");
const public_site_context_guard_1 = require("./guards/public-site-context.guard");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const public_cache_interceptor_1 = require("./interceptors/public-cache.interceptor");
const cache_invalidation_listener_1 = require("./listeners/cache-invalidation.listener");
let PublicApiModule = class PublicApiModule {
};
exports.PublicApiModule = PublicApiModule;
exports.PublicApiModule = PublicApiModule = __decorate([
    (0, common_1.Module)({
        imports: [site_module_1.SiteModule],
        providers: [
            public_site_context_guard_1.PublicSiteContextGuard,
            locale_resolver_service_1.LocaleResolverService,
            { provide: public_cache_interceptor_1.PUBLIC_CACHE_REDIS, useFactory: public_cache_interceptor_1.createPublicCacheRedisClient },
            public_cache_interceptor_1.PublicCacheInterceptor,
            cache_invalidation_listener_1.CacheInvalidationListener,
        ],
        exports: [public_site_context_guard_1.PublicSiteContextGuard, public_cache_interceptor_1.PublicCacheInterceptor, public_cache_interceptor_1.PUBLIC_CACHE_REDIS, locale_resolver_service_1.LocaleResolverService],
    })
], PublicApiModule);
//# sourceMappingURL=public-api.module.js.map