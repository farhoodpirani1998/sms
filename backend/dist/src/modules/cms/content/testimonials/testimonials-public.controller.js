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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialsPublicController = void 0;
const common_1 = require("@nestjs/common");
const testimonials_service_1 = require("./testimonials.service");
const testimonial_query_dto_1 = require("./dto/testimonial-query.dto");
const public_site_context_guard_1 = require("../../core/public-api/guards/public-site-context.guard");
const public_cache_interceptor_1 = require("../../core/public-api/interceptors/public-cache.interceptor");
const public_site_context_decorator_1 = require("../../common/decorators/public-site-context.decorator");
const site_entity_1 = require("../../core/site/entities/site.entity");
let TestimonialsPublicController = class TestimonialsPublicController {
    constructor(testimonialsService) {
        this.testimonialsService = testimonialsService;
    }
    async findPublished(site, query) {
        return this.testimonialsService.findPublished(site.id, query.locale);
    }
};
exports.TestimonialsPublicController = TestimonialsPublicController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, public_site_context_decorator_1.PublicSiteContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [site_entity_1.Site, testimonial_query_dto_1.PublicTestimonialQueryDto]),
    __metadata("design:returntype", Promise)
], TestimonialsPublicController.prototype, "findPublished", null);
exports.TestimonialsPublicController = TestimonialsPublicController = __decorate([
    (0, common_1.Controller)('public/testimonials'),
    (0, common_1.UseGuards)(public_site_context_guard_1.PublicSiteContextGuard),
    (0, common_1.UseInterceptors)(public_cache_interceptor_1.PublicCacheInterceptor),
    __metadata("design:paramtypes", [testimonials_service_1.TestimonialsService])
], TestimonialsPublicController);
//# sourceMappingURL=testimonials-public.controller.js.map