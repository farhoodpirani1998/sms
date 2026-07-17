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
exports.FeaturesPublicController = void 0;
const common_1 = require("@nestjs/common");
const features_service_1 = require("./features.service");
const feature_query_dto_1 = require("./dto/feature-query.dto");
const public_site_context_guard_1 = require("../../core/public-api/guards/public-site-context.guard");
const public_cache_interceptor_1 = require("../../core/public-api/interceptors/public-cache.interceptor");
const public_site_context_decorator_1 = require("../../common/decorators/public-site-context.decorator");
const site_entity_1 = require("../../core/site/entities/site.entity");
let FeaturesPublicController = class FeaturesPublicController {
    constructor(featuresService) {
        this.featuresService = featuresService;
    }
    async findPublished(site, query) {
        return this.featuresService.findPublished(site.id, query.locale);
    }
};
exports.FeaturesPublicController = FeaturesPublicController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, public_site_context_decorator_1.PublicSiteContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [site_entity_1.Site, feature_query_dto_1.PublicFeatureQueryDto]),
    __metadata("design:returntype", Promise)
], FeaturesPublicController.prototype, "findPublished", null);
exports.FeaturesPublicController = FeaturesPublicController = __decorate([
    (0, common_1.Controller)('public/features'),
    (0, common_1.UseGuards)(public_site_context_guard_1.PublicSiteContextGuard),
    (0, common_1.UseInterceptors)(public_cache_interceptor_1.PublicCacheInterceptor),
    __metadata("design:paramtypes", [features_service_1.FeaturesService])
], FeaturesPublicController);
//# sourceMappingURL=features-public.controller.js.map