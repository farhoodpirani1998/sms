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
exports.SiteSettings = void 0;
const typeorm_1 = require("typeorm");
const base_cms_entity_1 = require("../../../common/entities/base-cms.entity");
const site_entity_1 = require("../../../core/site/entities/site.entity");
let SiteSettings = class SiteSettings extends base_cms_entity_1.BaseCmsEntity {
};
exports.SiteSettings = SiteSettings;
__decorate([
    (0, typeorm_1.ManyToOne)(() => site_entity_1.Site),
    (0, typeorm_1.JoinColumn)({ name: 'site_id' }),
    __metadata("design:type", site_entity_1.Site)
], SiteSettings.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'footer_text', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SiteSettings.prototype, "footerText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], SiteSettings.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], SiteSettings.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_address', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SiteSettings.prototype, "contactAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'copyright_text', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SiteSettings.prototype, "copyrightText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'maintenance_mode', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SiteSettings.prototype, "maintenanceMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'analytics_id', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], SiteSettings.prototype, "analyticsId", void 0);
exports.SiteSettings = SiteSettings = __decorate([
    (0, typeorm_1.Entity)({ name: 'site_settings', schema: 'cms' })
], SiteSettings);
//# sourceMappingURL=site-settings.entity.js.map