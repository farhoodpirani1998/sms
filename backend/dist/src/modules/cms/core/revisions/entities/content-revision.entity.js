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
exports.ContentRevision = void 0;
const typeorm_1 = require("typeorm");
const cms_entity_type_enum_1 = require("../../../common/enums/cms-entity-type.enum");
let ContentRevision = class ContentRevision {
};
exports.ContentRevision = ContentRevision;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContentRevision.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_id' }),
    __metadata("design:type", String)
], ContentRevision.prototype, "siteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ContentRevision.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id' }),
    __metadata("design:type", String)
], ContentRevision.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ContentRevision.prototype, "snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], ContentRevision.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ContentRevision.prototype, "createdAt", void 0);
exports.ContentRevision = ContentRevision = __decorate([
    (0, typeorm_1.Entity)({ name: 'content_revisions', schema: 'cms' })
], ContentRevision);
//# sourceMappingURL=content-revision.entity.js.map