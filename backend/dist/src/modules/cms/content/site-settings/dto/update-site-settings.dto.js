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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreSiteSettingsDto = exports.ScheduleSiteSettingsDto = exports.PublicSiteSettingsQueryDto = exports.SiteIdQueryDto = exports.UpdateSiteSettingsDto = void 0;
const class_validator_1 = require("class-validator");
const locale_query_dto_1 = require("../../../common/dto/locale-query.dto");
class UpdateSiteSettingsDto {
}
exports.UpdateSiteSettingsDto = UpdateSiteSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSiteSettingsDto.prototype, "footerText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateSiteSettingsDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateSiteSettingsDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSiteSettingsDto.prototype, "contactAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSiteSettingsDto.prototype, "copyrightText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSiteSettingsDto.prototype, "maintenanceMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateSiteSettingsDto.prototype, "analyticsId", void 0);
class SiteIdQueryDto {
}
exports.SiteIdQueryDto = SiteIdQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SiteIdQueryDto.prototype, "siteId", void 0);
class PublicSiteSettingsQueryDto extends locale_query_dto_1.LocaleQueryDto {
}
exports.PublicSiteSettingsQueryDto = PublicSiteSettingsQueryDto;
class ScheduleSiteSettingsDto {
}
exports.ScheduleSiteSettingsDto = ScheduleSiteSettingsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScheduleSiteSettingsDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleSiteSettingsDto.prototype, "scheduledAt", void 0);
class RestoreSiteSettingsDto {
}
exports.RestoreSiteSettingsDto = RestoreSiteSettingsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RestoreSiteSettingsDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RestoreSiteSettingsDto.prototype, "revisionId", void 0);
//# sourceMappingURL=update-site-settings.dto.js.map