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
exports.StatisticsController = void 0;
const common_1 = require("@nestjs/common");
const statistics_service_1 = require("./statistics.service");
const upsert_statistic_dto_1 = require("./dto/upsert-statistic.dto");
const statistic_query_dto_1 = require("./dto/statistic-query.dto");
const restore_revision_dto_1 = require("../../core/revisions/dto/restore-revision.dto");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const permissions_guard_1 = require("../../../../common/authorization/permissions.guard");
const require_permission_decorator_1 = require("../../../../common/authorization/require-permission.decorator");
const permissions_1 = require("../../../../common/authorization/permissions");
const current_user_decorator_1 = require("../../../../common/decorators/current-user.decorator");
let StatisticsController = class StatisticsController {
    constructor(statisticsService) {
        this.statisticsService = statisticsService;
    }
    async create(dto, user) {
        const { siteId, ...data } = dto;
        return this.statisticsService.create(siteId, data, user.id);
    }
    async findAll(query) {
        return this.statisticsService.findAll(query.siteId, {
            page: query.page,
            limit: query.limit,
        });
    }
    async findOne(id, query) {
        return this.statisticsService.findOne(query.siteId, id);
    }
    async update(id, query, dto, user) {
        return this.statisticsService.update(query.siteId, id, dto, user.id);
    }
    async remove(id, query, user) {
        await this.statisticsService.remove(query.siteId, id, user.id);
        return { success: true };
    }
    async publish(id, query, user) {
        return this.statisticsService.publish(query.siteId, id, user.id);
    }
    async unpublish(id, query, user) {
        return this.statisticsService.unpublish(query.siteId, id, user.id);
    }
    async schedule(id, dto, user) {
        return this.statisticsService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
    }
    async restore(id, query, dto, user) {
        return this.statisticsService.restore(query.siteId, id, dto.revisionId, user.id);
    }
    async reorder(dto, user) {
        await this.statisticsService.reorder(dto.siteId, dto.orderedIds, user.id);
        return { success: true };
    }
};
exports.StatisticsController = StatisticsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_statistic_dto_1.CreateStatisticDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [statistic_query_dto_1.StatisticListQueryDto]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.SiteIdQueryDto]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.SiteIdQueryDto,
        upsert_statistic_dto_1.UpdateStatisticDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/unpublish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "unpublish", null);
__decorate([
    (0, common_1.Post)(':id/schedule'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.ScheduleStatisticDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "schedule", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, statistic_query_dto_1.SiteIdQueryDto,
        restore_revision_dto_1.RestoreRevisionDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)('reorder'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [statistic_query_dto_1.ReorderStatisticDto, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "reorder", null);
exports.StatisticsController = StatisticsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('school_admin', 'staff'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_EDIT),
    (0, common_1.Controller)('cms/statistics'),
    __metadata("design:paramtypes", [statistics_service_1.StatisticsService])
], StatisticsController);
//# sourceMappingURL=statistics.controller.js.map