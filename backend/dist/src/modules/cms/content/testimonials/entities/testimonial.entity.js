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
exports.Testimonial = void 0;
const typeorm_1 = require("typeorm");
const base_cms_entity_1 = require("../../../common/entities/base-cms.entity");
const site_entity_1 = require("../../../core/site/entities/site.entity");
const media_asset_entity_1 = require("../../../core/media/entities/media-asset.entity");
let Testimonial = class Testimonial extends base_cms_entity_1.BaseCmsEntity {
};
exports.Testimonial = Testimonial;
__decorate([
    (0, typeorm_1.ManyToOne)(() => site_entity_1.Site),
    (0, typeorm_1.JoinColumn)({ name: 'site_id' }),
    __metadata("design:type", site_entity_1.Site)
], Testimonial.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Testimonial.prototype, "quote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Testimonial.prototype, "authorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_role', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Testimonial.prototype, "authorRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_media_id', nullable: true }),
    __metadata("design:type", Object)
], Testimonial.prototype, "avatarMediaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_asset_entity_1.MediaAsset, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'avatar_media_id' }),
    __metadata("design:type", Object)
], Testimonial.prototype, "avatarMedia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: true }),
    __metadata("design:type", Object)
], Testimonial.prototype, "rating", void 0);
exports.Testimonial = Testimonial = __decorate([
    (0, typeorm_1.Entity)({ name: 'testimonials', schema: 'cms' })
], Testimonial);
//# sourceMappingURL=testimonial.entity.js.map