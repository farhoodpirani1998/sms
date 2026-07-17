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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const teachers_service_1 = require("./teachers.service");
const upsert_teacher_profile_dto_1 = require("./dto/upsert-teacher-profile.dto");
const teacher_profile_query_dto_1 = require("./dto/teacher-profile-query.dto");
const restore_revision_dto_1 = require("../../core/revisions/dto/restore-revision.dto");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const permissions_guard_1 = require("../../../../common/authorization/permissions.guard");
const require_permission_decorator_1 = require("../../../../common/authorization/require-permission.decorator");
const permissions_1 = require("../../../../common/authorization/permissions");
const current_user_decorator_1 = require("../../../../common/decorators/current-user.decorator");
let TeachersController = class TeachersController {
    constructor(teachersService) {
        this.teachersService = teachersService;
    }
    async create(dto, user) {
        const { siteId, ...data } = dto;
        return this.teachersService.create(siteId, data, user.id);
    }
    async findAll(query) {
        return this.teachersService.findAll(query.siteId, {
            page: query.page,
            limit: query.limit,
        });
    }
    async findOne(id, query) {
        return this.teachersService.findOne(query.siteId, id);
    }
    async update(id, query, dto, user) {
        return this.teachersService.update(query.siteId, id, dto, user.id);
    }
    async remove(id, query, user) {
        await this.teachersService.remove(query.siteId, id, user.id);
        return { success: true };
    }
    async publish(id, query, user) {
        return this.teachersService.publish(query.siteId, id, user.id);
    }
    async unpublish(id, query, user) {
        return this.teachersService.unpublish(query.siteId, id, user.id);
    }
    async schedule(id, dto, user) {
        return this.teachersService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
    }
    async restore(id, query, dto, user) {
        return this.teachersService.restore(query.siteId, id, dto.revisionId, user.id);
    }
    async reorder(dto, user) {
        await this.teachersService.reorder(dto.siteId, dto.orderedIds, user.id);
        return { success: true };
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_teacher_profile_dto_1.CreateTeacherProfileDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [teacher_profile_query_dto_1.TeacherProfileListQueryDto]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.SiteIdQueryDto]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.SiteIdQueryDto,
        upsert_teacher_profile_dto_1.UpdateTeacherProfileDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/unpublish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "unpublish", null);
__decorate([
    (0, common_1.Post)(':id/schedule'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.ScheduleTeacherProfileDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "schedule", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, teacher_profile_query_dto_1.SiteIdQueryDto,
        restore_revision_dto_1.RestoreRevisionDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)('reorder'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [teacher_profile_query_dto_1.ReorderTeacherProfilesDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "reorder", null);
exports.TeachersController = TeachersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('school_admin', 'staff'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_EDIT),
    (0, common_1.Controller)('cms/teachers'),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map