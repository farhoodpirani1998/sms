"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const page_entity_1 = require("../../content/pages/entities/page.entity");
const news_article_entity_1 = require("../../content/news/entities/news-article.entity");
const sitemap_service_1 = require("./sitemap.service");
const robots_service_1 = require("./robots.service");
const seo_public_controller_1 = require("./seo-public.controller");
const site_module_1 = require("../site/site.module");
const public_api_module_1 = require("../public-api/public-api.module");
let SeoModule = class SeoModule {
};
exports.SeoModule = SeoModule;
exports.SeoModule = SeoModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([page_entity_1.Page, news_article_entity_1.NewsArticle]), site_module_1.SiteModule, public_api_module_1.PublicApiModule],
        controllers: [seo_public_controller_1.SeoPublicController],
        providers: [sitemap_service_1.SitemapService, robots_service_1.RobotsService],
        exports: [sitemap_service_1.SitemapService, robots_service_1.RobotsService],
    })
], SeoModule);
//# sourceMappingURL=seo.module.js.map