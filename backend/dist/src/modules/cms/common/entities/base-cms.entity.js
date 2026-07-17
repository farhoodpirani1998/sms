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
exports.BaseCmsEntity = void 0;
const typeorm_1 = require("typeorm");
const content_status_enum_1 = require("../enums/content-status.enum");
class BaseCmsEntity {
}
exports.BaseCmsEntity = BaseCmsEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BaseCmsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_id' }),
    __metadata("design:type", String)
], BaseCmsEntity.prototype, "siteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BaseCmsEntity.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: content_status_enum_1.ContentStatus, default: content_status_enum_1.ContentStatus.DRAFT }),
    __metadata("design:type", String)
], BaseCmsEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'published_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], BaseCmsEntity.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scheduled_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], BaseCmsEntity.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BaseCmsEntity.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BaseCmsEntity.prototype, "updatedById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BaseCmsEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BaseCmsEntity.prototype, "updatedAt", void 0);
//# sourceMappingURL=base-cms.entity.js.map