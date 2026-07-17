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
exports.Site = void 0;
const typeorm_1 = require("typeorm");
let Site = class Site {
};
exports.Site = Site;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Site.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Site.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], Site.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_locale', type: 'varchar', length: 10, default: 'en' }),
    __metadata("design:type", String)
], Site.prototype, "defaultLocale", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supported_locales', type: 'jsonb', default: () => `'["en"]'` }),
    __metadata("design:type", Array)
], Site.prototype, "supportedLocales", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'social_links', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "socialLinks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seo_defaults', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Site.prototype, "seoDefaults", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Site.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Site.prototype, "updatedAt", void 0);
exports.Site = Site = __decorate([
    (0, typeorm_1.Entity)({ name: 'sites', schema: 'cms' })
], Site);
//# sourceMappingURL=site.entity.js.map