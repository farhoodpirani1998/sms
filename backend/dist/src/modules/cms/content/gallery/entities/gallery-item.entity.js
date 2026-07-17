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
exports.GalleryItem = void 0;
const typeorm_1 = require("typeorm");
const base_cms_entity_1 = require("../../../common/entities/base-cms.entity");
const site_entity_1 = require("../../../core/site/entities/site.entity");
const media_asset_entity_1 = require("../../../core/media/entities/media-asset.entity");
let GalleryItem = class GalleryItem extends base_cms_entity_1.BaseCmsEntity {
};
exports.GalleryItem = GalleryItem;
__decorate([
    (0, typeorm_1.ManyToOne)(() => site_entity_1.Site),
    (0, typeorm_1.JoinColumn)({ name: 'site_id' }),
    __metadata("design:type", site_entity_1.Site)
], GalleryItem.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], GalleryItem.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'media_id' }),
    __metadata("design:type", String)
], GalleryItem.prototype, "mediaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_asset_entity_1.MediaAsset),
    (0, typeorm_1.JoinColumn)({ name: 'media_id' }),
    __metadata("design:type", media_asset_entity_1.MediaAsset)
], GalleryItem.prototype, "media", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], GalleryItem.prototype, "category", void 0);
exports.GalleryItem = GalleryItem = __decorate([
    (0, typeorm_1.Entity)({ name: 'gallery_items', schema: 'cms' })
], GalleryItem);
//# sourceMappingURL=gallery-item.entity.js.map