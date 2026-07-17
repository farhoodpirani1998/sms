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
exports.NavigationItem = void 0;
const typeorm_1 = require("typeorm");
const base_cms_entity_1 = require("../../../common/entities/base-cms.entity");
const site_entity_1 = require("../../../core/site/entities/site.entity");
let NavigationItem = class NavigationItem extends base_cms_entity_1.BaseCmsEntity {
};
exports.NavigationItem = NavigationItem;
__decorate([
    (0, typeorm_1.ManyToOne)(() => site_entity_1.Site),
    (0, typeorm_1.JoinColumn)({ name: 'site_id' }),
    __metadata("design:type", site_entity_1.Site)
], NavigationItem.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], NavigationItem.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => NavigationItem, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Object)
], NavigationItem.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], NavigationItem.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2000, nullable: true }),
    __metadata("design:type", Object)
], NavigationItem.prototype, "url", void 0);
exports.NavigationItem = NavigationItem = __decorate([
    (0, typeorm_1.Entity)({ name: 'navigation_items', schema: 'cms' })
], NavigationItem);
//# sourceMappingURL=navigation-item.entity.js.map