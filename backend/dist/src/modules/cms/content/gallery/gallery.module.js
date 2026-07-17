"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gallery_item_entity_1 = require("./entities/gallery-item.entity");
const gallery_service_1 = require("./gallery.service");
const gallery_controller_1 = require("./gallery.controller");
const gallery_public_controller_1 = require("./gallery-public.controller");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const site_module_1 = require("../../core/site/site.module");
const revisions_module_1 = require("../../core/revisions/revisions.module");
const publishing_module_1 = require("../../core/publishing/publishing.module");
const ordering_module_1 = require("../../core/ordering/ordering.module");
const public_api_module_1 = require("../../core/public-api/public-api.module");
let GalleryModule = class GalleryModule {
};
exports.GalleryModule = GalleryModule;
exports.GalleryModule = GalleryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([gallery_item_entity_1.GalleryItem]),
            site_module_1.SiteModule,
            revisions_module_1.RevisionsModule,
            publishing_module_1.PublishingModule,
            ordering_module_1.OrderingModule,
            public_api_module_1.PublicApiModule,
        ],
        controllers: [gallery_controller_1.GalleryController, gallery_public_controller_1.GalleryPublicController],
        providers: [gallery_service_1.GalleryService, locale_resolver_service_1.LocaleResolverService],
    })
], GalleryModule);
//# sourceMappingURL=gallery.module.js.map