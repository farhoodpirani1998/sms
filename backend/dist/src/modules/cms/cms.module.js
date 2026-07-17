"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmsModule = void 0;
const common_1 = require("@nestjs/common");
const site_module_1 = require("./core/site/site.module");
const media_module_1 = require("./core/media/media.module");
const revisions_module_1 = require("./core/revisions/revisions.module");
const publishing_module_1 = require("./core/publishing/publishing.module");
const ordering_module_1 = require("./core/ordering/ordering.module");
const hero_module_1 = require("./content/hero/hero.module");
const about_module_1 = require("./content/about/about.module");
const cta_module_1 = require("./content/cta/cta.module");
const statistics_module_1 = require("./content/statistics/statistics.module");
const features_module_1 = require("./content/features/features.module");
const faq_module_1 = require("./content/faq/faq.module");
const site_settings_module_1 = require("./content/site-settings/site-settings.module");
const navigation_module_1 = require("./content/navigation/navigation.module");
const pages_module_1 = require("./content/pages/pages.module");
const seo_module_1 = require("./core/seo/seo.module");
const news_module_1 = require("./content/news/news.module");
const gallery_module_1 = require("./content/gallery/gallery.module");
const testimonials_module_1 = require("./content/testimonials/testimonials.module");
const teachers_module_1 = require("./content/teachers/teachers.module");
const campuses_module_1 = require("./content/campuses/campuses.module");
const public_api_module_1 = require("./core/public-api/public-api.module");
let CmsModule = class CmsModule {
};
exports.CmsModule = CmsModule;
exports.CmsModule = CmsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            site_module_1.SiteModule,
            media_module_1.MediaModule,
            revisions_module_1.RevisionsModule,
            publishing_module_1.PublishingModule,
            ordering_module_1.OrderingModule,
            hero_module_1.HeroModule,
            about_module_1.AboutModule,
            cta_module_1.CtaModule,
            statistics_module_1.StatisticsModule,
            features_module_1.FeaturesModule,
            faq_module_1.FaqModule,
            site_settings_module_1.SiteSettingsModule,
            navigation_module_1.NavigationModule,
            pages_module_1.PagesModule,
            seo_module_1.SeoModule,
            news_module_1.NewsModule,
            gallery_module_1.GalleryModule,
            testimonials_module_1.TestimonialsModule,
            teachers_module_1.TeachersModule,
            campuses_module_1.CampusesModule,
            public_api_module_1.PublicApiModule,
        ],
    })
], CmsModule);
//# sourceMappingURL=cms.module.js.map