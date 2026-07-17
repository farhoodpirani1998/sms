"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicSiteContextGuard = void 0;
const common_1 = require("@nestjs/common");
const site_resolver_service_1 = require("../../site/site-resolver.service");
const DEV_SITE_SLUG_QUERY_PARAM = 'site';
const DEV_SITE_SLUG_HEADER = 'x-cms-site-slug';
let PublicSiteContextGuard = class PublicSiteContextGuard {
    constructor(siteResolver) {
        this.siteResolver = siteResolver;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const host = request.headers?.host;
        const slugParam = request.query?.[DEV_SITE_SLUG_QUERY_PARAM];
        const slugHeader = request.headers?.[DEV_SITE_SLUG_HEADER];
        const slug = this.firstString(slugParam) ?? this.firstString(slugHeader);
        const site = await this.siteResolver.resolveFromHost(host, slug);
        request.cmsSite = site;
        return true;
    }
    firstString(value) {
        if (typeof value === 'string')
            return value;
        if (Array.isArray(value) && typeof value[0] === 'string')
            return value[0];
        return undefined;
    }
};
exports.PublicSiteContextGuard = PublicSiteContextGuard;
exports.PublicSiteContextGuard = PublicSiteContextGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [site_resolver_service_1.SiteResolverService])
], PublicSiteContextGuard);
//# sourceMappingURL=public-site-context.guard.js.map