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
exports.LocaleResolverService = void 0;
const common_1 = require("@nestjs/common");
const site_service_1 = require("../../core/site/site.service");
let LocaleResolverService = class LocaleResolverService {
    constructor(siteService) {
        this.siteService = siteService;
    }
    async resolve(siteId, requestedLocale) {
        const site = await this.siteService.findOne(siteId);
        if (requestedLocale && site.supportedLocales.includes(requestedLocale)) {
            return requestedLocale;
        }
        return site.defaultLocale;
    }
    resolveText(localized, locale, defaultLocale) {
        if (!localized) {
            return null;
        }
        if (localized[locale] !== undefined) {
            return localized[locale];
        }
        if (localized[defaultLocale] !== undefined) {
            return localized[defaultLocale];
        }
        const values = Object.values(localized);
        return values.length > 0 ? values[0] : null;
    }
};
exports.LocaleResolverService = LocaleResolverService;
exports.LocaleResolverService = LocaleResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [site_service_1.SiteService])
], LocaleResolverService);
//# sourceMappingURL=locale-resolver.service.js.map