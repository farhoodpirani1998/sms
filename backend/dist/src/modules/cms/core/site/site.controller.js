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
exports.SiteController = void 0;
const common_1 = require("@nestjs/common");
const site_service_1 = require("./site.service");
const create_site_dto_1 = require("./dto/create-site.dto");
const update_site_dto_1 = require("./dto/update-site.dto");
const jwt_auth_guard_1 = require("../../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../../common/decorators/roles.decorator");
const permissions_guard_1 = require("../../../../common/authorization/permissions.guard");
const require_permission_decorator_1 = require("../../../../common/authorization/require-permission.decorator");
const permissions_1 = require("../../../../common/authorization/permissions");
let SiteController = class SiteController {
    constructor(siteService) {
        this.siteService = siteService;
    }
    async findAll() {
        return this.siteService.findAll();
    }
    async findOne(id) {
        return this.siteService.findOne(id);
    }
    async create(dto) {
        return this.siteService.create(dto);
    }
    async update(id, dto) {
        return this.siteService.update(id, dto);
    }
};
exports.SiteController = SiteController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SiteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SiteController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_site_dto_1.CreateSiteDto]),
    __metadata("design:returntype", Promise)
], SiteController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_site_dto_1.UpdateSiteDto]),
    __metadata("design:returntype", Promise)
], SiteController.prototype, "update", null);
exports.SiteController = SiteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('school_admin'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.Permission.CMS_SITE_MANAGE),
    (0, common_1.Controller)('cms/sites'),
    __metadata("design:paramtypes", [site_service_1.SiteService])
], SiteController);
//# sourceMappingURL=site.controller.js.map