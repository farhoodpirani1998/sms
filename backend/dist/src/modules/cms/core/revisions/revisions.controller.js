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
exports.RevisionsController = void 0;
const common_1 = require("@nestjs/common");
const revisions_service_1 = require("./revisions.service");
const restore_revision_dto_1 = require("./dto/restore-revision.dto");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const permissions_guard_1 = require("../../../../common/authorization/permissions.guard");
const require_permission_decorator_1 = require("../../../../common/authorization/require-permission.decorator");
const permissions_1 = require("../../../../common/authorization/permissions");
const current_user_decorator_1 = require("../../../../common/decorators/current-user.decorator");
let RevisionsController = class RevisionsController {
    constructor(revisionsService) {
        this.revisionsService = revisionsService;
    }
    async list(entityType, id) {
        return this.revisionsService.list(entityType, id);
    }
    async restore(entityType, id, dto, user) {
        return this.revisionsService.restore(entityType, id, dto.revisionId, user.id);
    }
};
exports.RevisionsController = RevisionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RevisionsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('restore'),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, restore_revision_dto_1.RestoreRevisionDto, Object]),
    __metadata("design:returntype", Promise)
], RevisionsController.prototype, "restore", null);
exports.RevisionsController = RevisionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('school_admin', 'staff'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_EDIT),
    (0, common_1.Controller)('cms/:entityType/:id/revisions'),
    __metadata("design:paramtypes", [revisions_service_1.RevisionsService])
], RevisionsController);
//# sourceMappingURL=revisions.controller.js.map