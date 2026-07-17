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
exports.NewsArticle = void 0;
const typeorm_1 = require("typeorm");
const base_cms_entity_1 = require("../../../common/entities/base-cms.entity");
const site_entity_1 = require("../../../core/site/entities/site.entity");
const media_asset_entity_1 = require("../../../core/media/entities/media-asset.entity");
let NewsArticle = class NewsArticle extends base_cms_entity_1.BaseCmsEntity {
};
exports.NewsArticle = NewsArticle;
__decorate([
    (0, typeorm_1.ManyToOne)(() => site_entity_1.Site),
    (0, typeorm_1.JoinColumn)({ name: 'site_id' }),
    __metadata("design:type", site_entity_1.Site)
], NewsArticle.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], NewsArticle.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "excerpt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_title', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "metaTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_description', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "metaDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cover_media_id', nullable: true }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "coverMediaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_asset_entity_1.MediaAsset, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cover_media_id' }),
    __metadata("design:type", Object)
], NewsArticle.prototype, "coverMedia", void 0);
exports.NewsArticle = NewsArticle = __decorate([
    (0, typeorm_1.Entity)({ name: 'news_articles', schema: 'cms' })
], NewsArticle);
//# sourceMappingURL=news-article.entity.js.map