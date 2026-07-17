"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const testimonial_entity_1 = require("./entities/testimonial.entity");
const testimonials_service_1 = require("./testimonials.service");
const testimonials_controller_1 = require("./testimonials.controller");
const testimonials_public_controller_1 = require("./testimonials-public.controller");
const locale_resolver_service_1 = require("../../common/services/locale-resolver.service");
const site_module_1 = require("../../core/site/site.module");
const revisions_module_1 = require("../../core/revisions/revisions.module");
const publishing_module_1 = require("../../core/publishing/publishing.module");
const ordering_module_1 = require("../../core/ordering/ordering.module");
const public_api_module_1 = require("../../core/public-api/public-api.module");
let TestimonialsModule = class TestimonialsModule {
};
exports.TestimonialsModule = TestimonialsModule;
exports.TestimonialsModule = TestimonialsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([testimonial_entity_1.Testimonial]),
            site_module_1.SiteModule,
            revisions_module_1.RevisionsModule,
            publishing_module_1.PublishingModule,
            ordering_module_1.OrderingModule,
            public_api_module_1.PublicApiModule,
        ],
        controllers: [testimonials_controller_1.TestimonialsController, testimonials_public_controller_1.TestimonialsPublicController],
        providers: [testimonials_service_1.TestimonialsService, locale_resolver_service_1.LocaleResolverService],
    })
], TestimonialsModule);
//# sourceMappingURL=testimonials.module.js.map