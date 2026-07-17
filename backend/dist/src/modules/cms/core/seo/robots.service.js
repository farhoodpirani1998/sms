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
exports.RobotsService = void 0;
const common_1 = require("@nestjs/common");
const site_service_1 = require("../site/site.service");
let RobotsService = class RobotsService {
    constructor(siteService) {
        this.siteService = siteService;
    }
    async generate(siteId) {
        const site = await this.siteService.findOne(siteId);
        const baseUrl = `https://${site.domain}`;
        if (site.seoDefaults?.noIndex) {
            return 'User-agent: *\nDisallow: /\n';
        }
        return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
    }
};
exports.RobotsService = RobotsService;
exports.RobotsService = RobotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [site_service_1.SiteService])
], RobotsService);
//# sourceMappingURL=robots.service.js.map