"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const hero_entity_1 = require("./entities/hero.entity");
const hero_service_1 = require("./hero.service");
const hero_controller_1 = require("./hero.controller");
const hero_public_controller_1 = require("./hero-public.controller");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const site_module_1 = require("../../core/site/site.module");
const revisions_module_1 = require("../../core/revisions/revisions.module");
const publishing_module_1 = require("../../core/publishing/publishing.module");
const ordering_module_1 = require("../../core/ordering/ordering.module");
const public_api_module_1 = require("../../core/public-api/public-api.module");
let HeroModule = class HeroModule {
};
exports.HeroModule = HeroModule;
exports.HeroModule = HeroModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([hero_entity_1.Hero]),
            site_module_1.SiteModule,
            revisions_module_1.RevisionsModule,
            publishing_module_1.PublishingModule,
            ordering_module_1.OrderingModule,
            public_api_module_1.PublicApiModule,
        ],
        controllers: [hero_controller_1.HeroController, hero_public_controller_1.HeroPublicController],
        providers: [hero_service_1.HeroService, locale_resolver_service_1.LocaleResolverService],
    })
], HeroModule);
//# sourceMappingURL=hero.module.js.map