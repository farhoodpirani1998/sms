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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitemapService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const page_entity_1 = require("../../content/pages/entities/page.entity");
const news_article_entity_1 = require("../../content/news/entities/news-article.entity");
const content_status_enum_1 = require("../../common/enums/content-status.enum");
const site_service_1 = require("../site/site.service");
let SitemapService = class SitemapService {
    constructor(pageRepository, newsArticleRepository, siteService) {
        this.pageRepository = pageRepository;
        this.newsArticleRepository = newsArticleRepository;
        this.siteService = siteService;
    }
    async generate(siteId) {
        const site = await this.siteService.findOne(siteId);
        const baseUrl = `https://${site.domain}`;
        const pages = await this.pageRepository.find({
            where: { siteId, status: content_status_enum_1.ContentStatus.PUBLISHED },
            order: { updatedAt: 'DESC' },
        });
        const newsArticles = await this.newsArticleRepository.find({
            where: { siteId, status: content_status_enum_1.ContentStatus.PUBLISHED },
            order: { updatedAt: 'DESC' },
        });
        const pageEntries = pages.map((page) => {
            const loc = page.slug === 'home' ? baseUrl : `${baseUrl}/${page.slug}`;
            return this.buildUrlEntry(loc, page.updatedAt);
        });
        const newsEntries = newsArticles.map((article) => this.buildUrlEntry(`${baseUrl}/news/${article.slug}`, article.updatedAt));
        const urlEntries = [...pageEntries, ...newsEntries].join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
    }
    buildUrlEntry(loc, updatedAt) {
        const lastmod = updatedAt.toISOString();
        return `  <url>\n    <loc>${this.escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    }
    escapeXml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
};
exports.SitemapService = SitemapService;
exports.SitemapService = SitemapService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(page_entity_1.Page)),
    __param(1, (0, typeorm_1.InjectRepository)(news_article_entity_1.NewsArticle)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        site_service_1.SiteService])
], SitemapService);
//# sourceMappingURL=sitemap.service.js.map