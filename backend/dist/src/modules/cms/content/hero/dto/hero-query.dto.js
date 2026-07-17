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
exports.ReorderHeroDto = exports.ScheduleHeroDto = exports.PublicHeroQueryDto = exports.HeroListQueryDto = exports.SiteIdQueryDto = void 0;
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
class HeroListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
}
exports.HeroListQueryDto = HeroListQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HeroListQueryDto.prototype, "siteId", void 0);
class PublicHeroQueryDto extends locale_query_dto_1.LocaleQueryDto {
}
exports.PublicHeroQueryDto = PublicHeroQueryDto;
class ScheduleHeroDto {
}
exports.ScheduleHeroDto = ScheduleHeroDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScheduleHeroDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleHeroDto.prototype, "scheduledAt", void 0);
class ReorderHeroDto {
}
exports.ReorderHeroDto = ReorderHeroDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReorderHeroDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], ReorderHeroDto.prototype, "orderedIds", void 0);
//# sourceMappingURL=hero-query.dto.js.map