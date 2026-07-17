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
exports.ReparentNavigationItemDto = exports.ReorderNavigationItemsDto = exports.ScheduleNavigationItemDto = exports.PublicNavigationQueryDto = exports.NavigationItemListQueryDto = exports.SiteIdQueryDto = void 0;
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
class NavigationItemListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
}
exports.NavigationItemListQueryDto = NavigationItemListQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NavigationItemListQueryDto.prototype, "siteId", void 0);
class PublicNavigationQueryDto extends locale_query_dto_1.LocaleQueryDto {
}
exports.PublicNavigationQueryDto = PublicNavigationQueryDto;
class ScheduleNavigationItemDto {
}
exports.ScheduleNavigationItemDto = ScheduleNavigationItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScheduleNavigationItemDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleNavigationItemDto.prototype, "scheduledAt", void 0);
class ReorderNavigationItemsDto {
}
exports.ReorderNavigationItemsDto = ReorderNavigationItemsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReorderNavigationItemsDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReorderNavigationItemsDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], ReorderNavigationItemsDto.prototype, "orderedIds", void 0);
class ReparentNavigationItemDto {
}
exports.ReparentNavigationItemDto = ReparentNavigationItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReparentNavigationItemDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReparentNavigationItemDto.prototype, "parentId", void 0);
//# sourceMappingURL=navigation-item-query.dto.js.map