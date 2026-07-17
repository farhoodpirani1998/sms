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
exports.GalleryController = void 0;
const common_1 = require("@nestjs/common");
const gallery_service_1 = require("./gallery.service");
const upsert_gallery_item_dto_1 = require("./dto/upsert-gallery-item.dto");
const gallery_item_query_dto_1 = require("./dto/gallery-item-query.dto");
const restore_revision_dto_1 = require("../../core/revisions/dto/restore-revision.dto");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const permissions_guard_1 = require("../../../../common/authorization/permissions.guard");
const require_permission_decorator_1 = require("../../../../common/authorization/require-permission.decorator");
const permissions_1 = require("../../../../common/authorization/permissions");
const current_user_decorator_1 = require("../../../../common/decorators/current-user.decorator");
let GalleryController = class GalleryController {
    constructor(galleryService) {
        this.galleryService = galleryService;
    }
    async create(dto, user) {
        const { siteId, ...data } = dto;
        return this.galleryService.create(siteId, data, user.id);
    }
    async findAll(query) {
        return this.galleryService.findAllByCategory(query.siteId, { page: query.page, limit: query.limit }, query.category);
    }
    async findOne(id, query) {
        return this.galleryService.findOne(query.siteId, id);
    }
    async update(id, query, dto, user) {
        return this.galleryService.update(query.siteId, id, dto, user.id);
    }
    async remove(id, query, user) {
        await this.galleryService.remove(query.siteId, id, user.id);
        return { success: true };
    }
    async publish(id, query, user) {
        return this.galleryService.publish(query.siteId, id, user.id);
    }
    async unpublish(id, query, user) {
        return this.galleryService.unpublish(query.siteId, id, user.id);
    }
    async schedule(id, dto, user) {
        return this.galleryService.schedule(dto.siteId, id, new Date(dto.scheduledAt), user.id);
    }
    async restore(id, query, dto, user) {
        return this.galleryService.restore(query.siteId, id, dto.revisionId, user.id);
    }
    async reorder(dto, user) {
        await this.galleryService.reorder(dto.siteId, dto.orderedIds, user.id);
        return { success: true };
    }
};
exports.GalleryController = GalleryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_gallery_item_dto_1.CreateGalleryItemDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gallery_item_query_dto_1.GalleryListQueryDto]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.SiteIdQueryDto]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.SiteIdQueryDto,
        upsert_gallery_item_dto_1.UpdateGalleryItemDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/unpublish'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.SiteIdQueryDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "unpublish", null);
__decorate([
    (0, common_1.Post)(':id/schedule'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_PUBLISH),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.ScheduleGalleryItemDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "schedule", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gallery_item_query_dto_1.SiteIdQueryDto,
        restore_revision_dto_1.RestoreRevisionDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)('reorder'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gallery_item_query_dto_1.ReorderGalleryItemsDto, Object]),
    __metadata("design:returntype", Promise)
], GalleryController.prototype, "reorder", null);
exports.GalleryController = GalleryController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('school_admin', 'staff'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_CONTENT_EDIT),
    (0, common_1.Controller)('cms/gallery'),
    __metadata("design:paramtypes", [gallery_service_1.GalleryService])
], GalleryController);
//# sourceMappingURL=gallery.controller.js.map