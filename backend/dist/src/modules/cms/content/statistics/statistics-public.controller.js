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
exports.StatisticsPublicController = void 0;
const common_1 = require("@nestjs/common");
const statistics_service_1 = require("./statistics.service");
const statistic_query_dto_1 = require("./dto/statistic-query.dto");
const public_site_context_guard_1 = require("../../core/public-api/guards/public-site-context.guard");
const public_cache_interceptor_1 = require("../../core/public-api/interceptors/public-cache.interceptor");
const public_site_context_decorator_1 = require("../../common/decorators/public-site-context.decorator");
const site_entity_1 = require("../../core/site/entities/site.entity");
let StatisticsPublicController = class StatisticsPublicController {
    constructor(statisticsService) {
        this.statisticsService = statisticsService;
    }
    async findPublished(site, query) {
        return this.statisticsService.findPublished(site.id, query.locale);
    }
};
exports.StatisticsPublicController = StatisticsPublicController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, public_site_context_decorator_1.PublicSiteContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [site_entity_1.Site, statistic_query_dto_1.PublicStatisticQueryDto]),
    __metadata("design:returntype", Promise)
], StatisticsPublicController.prototype, "findPublished", null);
exports.StatisticsPublicController = StatisticsPublicController = __decorate([
    (0, common_1.Controller)('public/statistics'),
    (0, common_1.UseGuards)(public_site_context_guard_1.PublicSiteContextGuard),
    (0, common_1.UseInterceptors)(public_cache_interceptor_1.PublicCacheInterceptor),
    __metadata("design:paramtypes", [statistics_service_1.StatisticsService])
], StatisticsPublicController);
//# sourceMappingURL=statistics-public.controller.js.map