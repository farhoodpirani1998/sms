"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const page_entity_1 = require("./entities/page.entity");
const pages_service_1 = require("./pages.service");
const pages_controller_1 = require("./pages.controller");
const pages_public_controller_1 = require("./pages-public.controller");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const site_module_1 = require("../../core/site/site.module");
const revisions_module_1 = require("../../core/revisions/revisions.module");
const publishing_module_1 = require("../../core/publishing/publishing.module");
const ordering_module_1 = require("../../core/ordering/ordering.module");
const public_api_module_1 = require("../../core/public-api/public-api.module");
let PagesModule = class PagesModule {
};
exports.PagesModule = PagesModule;
exports.PagesModule = PagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([page_entity_1.Page]),
            site_module_1.SiteModule,
            revisions_module_1.RevisionsModule,
            publishing_module_1.PublishingModule,
            ordering_module_1.OrderingModule,
            public_api_module_1.PublicApiModule,
        ],
        controllers: [pages_controller_1.PagesController, pages_public_controller_1.PagesPublicController],
        providers: [pages_service_1.PagesService, locale_resolver_service_1.LocaleResolverService],
    })
], PagesModule);
//# sourceMappingURL=pages.module.js.map