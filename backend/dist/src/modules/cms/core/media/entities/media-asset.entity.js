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
exports.MediaAsset = void 0;
const typeorm_1 = require("typeorm");
const site_entity_1 = require("../../site/entities/site.entity");
let MediaAsset = class MediaAsset {
};
exports.MediaAsset = MediaAsset;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MediaAsset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_id' }),
    __metadata("design:type", String)
], MediaAsset.prototype, "siteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => site_entity_1.Site),
    (0, typeorm_1.JoinColumn)({ name: 'site_id' }),
    __metadata("design:type", site_entity_1.Site)
], MediaAsset.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_filename', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], MediaAsset.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', type: 'varchar', length: 127 }),
    __metadata("design:type", String)
], MediaAsset.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'size_bytes',
        type: 'bigint',
        transformer: {
            to: (value) => value,
            from: (value) => parseInt(value, 10),
        },
    }),
    __metadata("design:type", Number)
], MediaAsset.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'storage_key', type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], MediaAsset.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1000 }),
    __metadata("design:type", String)
], MediaAsset.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], MediaAsset.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], MediaAsset.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alt_text', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], MediaAsset.prototype, "altText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MediaAsset.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MediaAsset.prototype, "createdAt", void 0);
exports.MediaAsset = MediaAsset = __decorate([
    (0, typeorm_1.Entity)({ name: 'media_assets', schema: 'cms' })
], MediaAsset);
//# sourceMappingURL=media-asset.entity.js.map