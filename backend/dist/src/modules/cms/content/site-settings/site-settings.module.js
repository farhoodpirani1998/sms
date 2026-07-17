"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteSettingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const site_settings_entity_1 = require("./entities/site-settings.entity");
const site_settings_service_1 = require("./site-settings.service");
const site_settings_controller_1 = require("./site-settings.controller");
const site_settings_public_controller_1 = require("./site-settings-public.controller");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const site_module_1 = require("../../core/site/site.module");
const revisions_module_1 = require("../../core/revisions/revisions.module");
const publishing_module_1 = require("../../core/publishing/publishing.module");
const public_api_module_1 = require("../../core/public-api/public-api.module");
let SiteSettingsModule = class SiteSettingsModule {
};
exports.SiteSettingsModule = SiteSettingsModule;
exports.SiteSettingsModule = SiteSettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([site_settings_entity_1.SiteSettings]),
            site_module_1.SiteModule,
            revisions_module_1.RevisionsModule,
            publishing_module_1.PublishingModule,
            public_api_module_1.PublicApiModule,
        ],
        controllers: [site_settings_controller_1.SiteSettingsController, site_settings_public_controller_1.SiteSettingsPublicController],
        providers: [site_settings_service_1.SiteSettingsService, locale_resolver_service_1.LocaleResolverService],
    })
], SiteSettingsModule);
//# sourceMappingURL=site-settings.module.js.map