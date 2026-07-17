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
exports.ReorderTeacherProfilesDto = exports.ScheduleTeacherProfileDto = exports.PublicTeacherProfileQueryDto = exports.TeacherProfileListQueryDto = exports.SiteIdQueryDto = void 0;
const class_validator_1 = require("class-validator");
const pagination_query_dto_1 = require("../../../common/dto/pagination-query.dto");
const locale_query_dto_1 = require("../../../common/dto/locale-query.dto");
class SiteIdQueryDto {
}
exports.SiteIdQueryDto = SiteIdQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SiteIdQueryDto.prototype, "siteId", void 0);
class TeacherProfileListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
}
exports.TeacherProfileListQueryDto = TeacherProfileListQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeacherProfileListQueryDto.prototype, "siteId", void 0);
class PublicTeacherProfileQueryDto extends locale_query_dto_1.LocaleQueryDto {
}
exports.PublicTeacherProfileQueryDto = PublicTeacherProfileQueryDto;
class ScheduleTeacherProfileDto {
}
exports.ScheduleTeacherProfileDto = ScheduleTeacherProfileDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScheduleTeacherProfileDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleTeacherProfileDto.prototype, "scheduledAt", void 0);
class ReorderTeacherProfilesDto {
}
exports.ReorderTeacherProfilesDto = ReorderTeacherProfilesDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReorderTeacherProfilesDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], ReorderTeacherProfilesDto.prototype, "orderedIds", void 0);
//# sourceMappingURL=teacher-profile-query.dto.js.map