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
exports.SiteSettingsController = void 0;
const common_1 = require("@nestjs/common");
const site_settings_service_1 = require("./site-settings.service");
const update_site_settings_dto_1 = require("./dto/update-site-settings.dto");
const update_site_settings_dto_2 = require("./dto/update-site-settings.dto");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const permissions_guard_1 = require("../../../../common/authorization/permissions.guard");
const require_permission_decorator_1 = require("../../../../common/authorization/require-permission.decorator");
const permissions_1 = require("../../../../common/authorization/permissions");
const current_user_decorator_1 = require("../../../../common/decorators/current-user.decorator");
let SiteSettingsController = class SiteSettingsController {
    constructor(siteSettingsService) {
        this.siteSettingsService = siteSettingsService;
    }
    async find(query, user) {
        return this.siteSettingsService.getOrCreate(query.siteId, user.id);
    }
    async update(query, dto, user) {
        return this.siteSettingsService.updateSettings(query.siteId, dto, user.id);
    }
    async publish(query, user) {
        return this.siteSettingsService.publish(query.siteId, user.id);
    }
    async unpublish(query, user) {
        return this.siteSettingsService.unpublish(query.siteId, user.id);
    }
    async schedule(dto, user) {
        return this.siteSettingsService.schedule(dto.siteId, new Date(dto.scheduledAt), user.id);
    }
    async restore(dto, user) {
        return this.siteSettingsService.restore(dto.siteId, dto.revisionId, user.id);
    }
};
exports.SiteSettingsController = SiteSettingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_site_settings_dto_2.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SiteSettingsController.prototype, "find", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_site_settings_dto_2.SiteIdQueryDto,
        update_site_settings_dto_1.UpdateSiteSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SiteSettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('publish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_site_settings_dto_2.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SiteSettingsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)('unpublish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_site_settings_dto_2.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SiteSettingsController.prototype, "unpublish", null);
__decorate([
    (0, common_1.Post)('schedule'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_site_settings_dto_2.ScheduleSiteSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SiteSettingsController.prototype, "schedule", null);
__decorate([
    (0, common_1.Post)('restore'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_site_settings_dto_2.RestoreSiteSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SiteSettingsController.prototype, "restore", null);
exports.SiteSettingsController = SiteSettingsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('school_admin', 'staff'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_EDIT),
    (0, common_1.Controller)('cms/site-settings'),
    __metadata("design:paramtypes", [site_settings_service_1.SiteSettingsService])
], SiteSettingsController);
//# sourceMappingURL=site-settings.controller.js.map