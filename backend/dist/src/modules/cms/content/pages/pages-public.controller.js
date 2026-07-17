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
exports.PagesPublicController = void 0;
const common_1 = require("@nestjs/common");
const pages_service_1 = require("./pages.service");
const page_query_dto_1 = require("./dto/page-query.dto");
const public_site_context_guard_1 = require("../../core/public-api/guards/public-site-context.guard");
const public_cache_interceptor_1 = require("../../core/public-api/interceptors/public-cache.interceptor");
const public_site_context_decorator_1 = require("../../common/decorators/public-site-context.decorator");
const site_entity_1 = require("../../core/site/entities/site.entity");
let PagesPublicController = class PagesPublicController {
    constructor(pagesService) {
        this.pagesService = pagesService;
    }
    async findBySlug(slug, site, query) {
        const page = await this.pagesService.findPublishedBySlug(site.id, slug, query.locale);
        if (!page) {
            throw new common_1.NotFoundException('Page not found');
        }
        return page;
    }
};
exports.PagesPublicController = PagesPublicController;
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, public_site_context_decorator_1.PublicSiteContext)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, site_entity_1.Site,
        page_query_dto_1.PublicPageQueryDto]),
    __metadata("design:returntype", Promise)
], PagesPublicController.prototype, "findBySlug", null);
exports.PagesPublicController = PagesPublicController = __decorate([
    (0, common_1.Controller)('public/pages'),
    (0, common_1.UseGuards)(public_site_context_guard_1.PublicSiteContextGuard),
    (0, common_1.UseInterceptors)(public_cache_interceptor_1.PublicCacheInterceptor),
    __metadata("design:paramtypes", [pages_service_1.PagesService])
], PagesPublicController);
//# sourceMappingURL=pages-public.controller.js.map