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
exports.ReorderNewsArticlesDto = exports.ScheduleNewsArticleDto = exports.PublicNewsQueryDto = exports.PublicNewsListQueryDto = exports.NewsListQueryDto = exports.SiteIdQueryDto = void 0;
const class_validator_1 = require("class-validator");
const pagination_query_dto_1 = require("../../../common/dto/pagination-query.dto");
class SiteIdQueryDto {
}
exports.SiteIdQueryDto = SiteIdQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SiteIdQueryDto.prototype, "siteId", void 0);
class NewsListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
}
exports.NewsListQueryDto = NewsListQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NewsListQueryDto.prototype, "siteId", void 0);
class PublicNewsListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
}
exports.PublicNewsListQueryDto = PublicNewsListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 10),
    __metadata("design:type", String)
], PublicNewsListQueryDto.prototype, "locale", void 0);
class PublicNewsQueryDto {
}
exports.PublicNewsQueryDto = PublicNewsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 10),
    __metadata("design:type", String)
], PublicNewsQueryDto.prototype, "locale", void 0);
class ScheduleNewsArticleDto {
}
exports.ScheduleNewsArticleDto = ScheduleNewsArticleDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScheduleNewsArticleDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ScheduleNewsArticleDto.prototype, "scheduledAt", void 0);
class ReorderNewsArticlesDto {
}
exports.ReorderNewsArticlesDto = ReorderNewsArticlesDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReorderNewsArticlesDto.prototype, "siteId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], ReorderNewsArticlesDto.prototype, "orderedIds", void 0);
//# sourceMappingURL=news-query.dto.js.map