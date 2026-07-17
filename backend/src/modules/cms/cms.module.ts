import { Module } from '@nestjs/common';
import { SiteModule } from './core/site/site.module';
import { MediaModule } from './core/media/media.module';
import { RevisionsModule } from './core/revisions/revisions.module';
import { PublishingModule } from './core/publishing/publishing.module';
import { OrderingModule } from './core/ordering/ordering.module';
import { HeroModule } from './content/hero/hero.module';
import { AboutModule } from './content/about/about.module';
import { CtaModule } from './content/cta/cta.module';
import { StatisticsModule } from './content/statistics/statistics.module';
import { FeaturesModule } from './content/features/features.module';
import { FaqModule } from './content/faq/faq.module';
import { SiteSettingsModule } from './content/site-settings/site-settings.module';
import { NavigationModule } from './content/navigation/navigation.module';
import { PagesModule } from './content/pages/pages.module';
import { SeoModule } from './core/seo/seo.module';
import { NewsModule } from './content/news/news.module';
import { GalleryModule } from './content/gallery/gallery.module';
import { TestimonialsModule } from './content/testimonials/testimonials.module';
import { TeachersModule } from './content/teachers/teachers.module';
import { CampusesModule } from './content/campuses/campuses.module';
import { PublicApiModule } from './core/public-api/public-api.module';

/**
 * Aggregates every `core/*` and `content/*` CMS sub-module. Imported once
 * in AppModule (see docs/architecture/CMS_ARCHITECTURE.md §7) — nothing
 * else in the existing app changes.
 *
 * CMS-A wired up `core/site` (schema + Site entity/CRUD). CMS-B lands
 * `core/media` (table, storage providers, upload endpoint, and — CMS-B.5,
 * optional — async thumbnailing). CMS-C.1 adds `core/revisions` (table +
 * empty module skeleton only — `RevisionsService`/controller land in
 * CMS-C.2) and the CMS-scoped domain-event vocabulary
 * (`core/events/cms-domain-events.ts`, not yet imported anywhere since no
 * service emits/listens to it until CMS-C.2 onward).
 *
 * CMS-C.4 built `PublishingModule`/`OrderingModule` but proved them only
 * in isolation, against fake repositories — neither was imported here
 * yet, since no concrete content table existed to wire them into
 * end-to-end. CMS-C.5 was that end-to-end proof: it imported both here
 * for the first time, alongside `ProofBlockModule` (`content/_proof/`),
 * a disposable content type that exercised the full CRUD → revision
 * snapshot → publish → event → audit pipeline before any real content
 * type existed. `ProofBlockModule` was always expected to be removed
 * once it was no longer needed as a reference (see its own doc
 * comments) — now that all 14 real content types (CMS-D through CMS-H)
 * are built and copy the same shape, it has been deleted: the entity,
 * DTOs, service, controller, and module under `content/_proof/`, this
 * import/registration, its `cms.proof_blocks` migration (dropped via a
 * new down-migration rather than editing the original CMS-C.5 one —
 * see `database/migrations/`), the `cms-proof-block.e2e-spec.ts` e2e
 * spec, and its entry in `test/setup/test-app.ts`'s `truncateAll`.
 * `PublishingModule`/`OrderingModule` stay regardless, since every real
 * content type needs them too.
 *
 * CMS-D.1 adds `HeroModule` (`content/hero/`): the first real,
 * non-disposable content type, and the reference implementation D.2–D.6
 * copy 1:1 against the five other tables `CmsSimpleContent` (CMS-D.1's
 * migration) already created for them (about/cta/statistics/features/
 * faq) — each lands its own module import here as it's built.
 *
 * CMS-D.2 adds `AboutModule` (`content/about/`), copying `HeroModule`'s
 * shape onto the `about_items` table — confirms the pattern replicates
 * cleanly to a second content type.
 *
 * CMS-D.3 adds `CtaModule` (`content/cta/`), copying the same shape onto
 * the `cta_items` table — no `coverMediaId`/`MediaAsset` reference here,
 * since CTA has no image field (see that entity's doc comment).
 *
 * CMS-D.4 adds `StatisticsModule` (`content/statistics/`), copying the
 * same shape onto the `statistics` table — the first real (non-proof)
 * content type exercising `OrderingService.reorder()` operationally,
 * per the roadmap's D.4 note.
 *
 * CMS-D.5 adds `FeaturesModule` (`content/features/`), copying the same
 * shape onto the `features` table — `coverMediaId`/`MediaAsset` is back
 * here (third and last of the three CMS-D types with an image field,
 * per the migration's doc comment).
 *
 * CMS-D.6 adds `FaqModule` (`content/faq/`), copying the same shape onto
 * the `faqs` table — simplest of the six (just required `question`/
 * `answer`, no scalar or media field). This completes CMS-D: all six
 * simple content types (hero/about/cta/statistics/features/faq) are now
 * wired in. CMS-E (Site Settings + Navigation) can begin.
 *
 * CMS-E.1 adds `SiteSettingsModule` (`content/site-settings/`) — the
 * first CMS-E type and the first singleton content type: exactly one
 * row per Site, enforced by a UNIQUE `site_id` constraint (this
 * sub-phase's migration) plus `SiteSettingsService.getOrCreate()`.
 * `NavigationModule` (CMS-E.2) shares that same migration's second
 * table and is added here once it lands.
 *
 * CMS-E.2 adds `NavigationModule` (`content/navigation/`) — the second
 * and last CMS-E type, sharing `CmsSiteSettingsNavigation`'s
 * `navigation_items` table (already created in CMS-E.1). Unlike every
 * CMS-D type and `SiteSettings`, it's a self-referencing tree
 * (`parentId`) rather than a flat per-Site list, so its service adds
 * tree assembly and per-parent reordering on top of the same
 * `BaseContentService`/`PublishingService`/`OrderingService` primitives.
 * This completes CMS-E. CMS-F (Pages) can begin.
 *
 * CMS-F.1 adds `PagesModule` (`content/pages/`) — the first CMS-F type,
 * and the first content type addressed by a public `slug` (unique per
 * Site) rather than only an internal id. Otherwise follows the same
 * `BaseContentService`/`PublishingService`/`OrderingService` shape as
 * every prior type.
 *
 * CMS-F.2 adds `PagesPublicController` (by-slug lookup, wired into
 * `PagesModule`) and `SeoModule` (`core/seo/`): `SitemapService`/
 * `RobotsService` walk published Pages and render sitemap/robots
 * bodies, exported for `SeoPublicController` (CMS-I.5) to expose as
 * actual `GET /sitemap.xml`/`GET /robots.txt` routes once the
 * Host-based Site-resolution guard (CMS-I.1) exists. This completes
 * CMS-F; `core/seo/` is ready for News (CMS-G.2) to plug its own table
 * into the same two services.
 *
 * CMS-G.1 adds `NewsModule` (`content/news/`) — the first CMS-G type,
 * mirroring `PagesModule`'s admin-CRUD shape (`BaseContentService`/
 * `PublishingService`/`OrderingService`, slug uniqueness, embedded SEO)
 * onto its own `news_articles` table. No public controller yet — that,
 * plus sitemap wiring into `SeoModule`, is CMS-G.2.
 *
 * CMS-G.2 adds `NewsPublicController` (paginated listing + by-slug
 * detail, wired into `NewsModule`) and extends `SeoModule`'s
 * `SitemapService` to walk published `NewsArticle` rows alongside
 * `Page` (under `/news/{slug}`). This completes CMS-G. CMS-H (Gallery,
 * Testimonials, Teachers, Campuses) can begin.
 *
 * CMS-H.1 adds `GalleryModule` (`content/gallery/`) — the first CMS-H
 * type, copying `FeaturesModule`'s (CMS-D.5) admin+public shape onto the
 * `gallery_items` table (one of four tables this sub-phase's migration
 * creates; testimonials/teacher_profiles/campuses sit unused until
 * H.2–H.4). The one shape difference: `GalleryItem.media` is a required
 * relation (every other type's media reference is optional), and both
 * the admin and public controllers take an optional `?category=` filter.
 *
 * CMS-H.2 adds `TestimonialsModule` (`content/testimonials/`) — the
 * second CMS-H type, copying `GalleryModule`'s shape onto the
 * `testimonials` table (already created by H.1's migration). Back to an
 * optional `avatarMediaId` (not required, unlike `GalleryItem.media`),
 * plus a non-localized `authorName` and an optional 1–5 `rating`.
 *
 * CMS-H.3 adds `TeachersModule` (`content/teachers/`) — the third
 * CMS-H type, onto the `teacher_profiles` table (already created by
 * H.1's migration). `TeacherProfile` is a CMS-owned display entity for
 * the public "our teachers" page, deliberately carrying no FK or import
 * relationship to the School-domain `Teacher` (`modules/teacher`) —
 * see that entity's doc comment for the bounded-context rationale.
 * `TeachersModule` imports nothing from `modules/school`/
 * `modules/teacher`, preserving the same import-boundary lint rule
 * every other `modules/cms` module already respects.
 *
 * CMS-H.4 adds `CampusesModule` (`content/campuses/`) — the fourth and
 * last CMS-H type, onto the `campuses` table (already created by H.1's
 * migration). No `MediaAsset` reference at all (unlike Gallery/
 * Testimonials/Teachers) — see that entity's doc comment. This
 * completes CMS-H: all 14 content types now exist and are independently
 * reachable via admin + public controllers. CMS-I wires the shared
 * public-API plumbing (Host-based Site resolution, caching) across all
 * of them next.
 *
 * CMS-I.1 adds `PublicApiModule` (`core/public-api/`): `SiteResolverService`
 * (CMS-A.3 stub, in `core/site`) is edited in place to implement real
 * Host-header → `Site.domain` resolution plus a dev-only slug fallback,
 * and `PublicSiteContextGuard` + `@PublicSiteContext()` wrap that as a
 * guard/decorator pair that resolves a `Site` and attaches it to the
 * request. Per the roadmap, this sub-phase stops there — the guard is
 * not yet applied to any public controller; that + `PublicCacheInterceptor`
 * land in CMS-I.2 onward.
 *
 * CMS-I.2 fills out the rest of `PublicApiModule`: `PublicCacheInterceptor`
 * (`core/public-api/interceptors/`) caches public GET responses in Redis
 * keyed `cms:public:{siteId}:{locale}:{route}`, and
 * `CacheInvalidationListener` (`core/public-api/listeners/`) subscribes
 * to `CONTENT_PUBLISHED`/`CONTENT_UNPUBLISHED`/`CONTENT_UPDATED` (all
 * defined since CMS-C.1, emitted since CMS-C.3/C.4) to clear a Site's
 * cached keys on write. Both share one dedicated ioredis connection
 * (not BullMQ's) via the module's `PUBLIC_CACHE_REDIS` provider. Guard +
 * interceptor + listener are all proven in isolation now; wiring them
 * onto the 14 public controllers is CMS-I.3–I.5.
 *
 * CMS-I.3 wires `PublicSiteContextGuard`/`PublicCacheInterceptor` onto
 * the six CMS-D public controllers (Hero/About/CTA/Statistics/Features/
 * FAQ) — each drops its `?siteId=` query param in favor of
 * `@PublicSiteContext()`.
 *
 * CMS-I.4 does the same for Site Settings/Navigation/Pages/News —
 * Navigation's tree response and Pages'/News' by-slug lookups needed no
 * special handling; the guard/interceptor pair is agnostic to response
 * shape and route params alike.
 *
 * CMS-I.5 finishes the sweep: Gallery/Testimonials/Teachers/Campuses
 * get the same guard/interceptor pairing (Gallery's `?category=` filter
 * composes with the cache key exactly like `?locale=` does), and
 * `SeoModule` gains its long-promised `SeoPublicController`, exposing
 * `GET /sitemap.xml`/`GET /robots.txt` — the same guard resolves the
 * Site for these two as for every other public route, even though
 * neither lives under `cms/public/`. Every public CMS endpoint (14
 * content types plus sitemap/robots) is now Site-resolved and cached.
 * Per the roadmap, this completes CMS-I and the module as a whole (34/34
 * sub-phases).
 *
 * `CmsModule` must never import `SchoolModule`/`SchoolsModule`, and no
 * CMS provider may inject a School repository or service — that's the
 * enforcement point for "CMS is a bounded context separate from School"
 * (architecture §1/§7).
 */
@Module({
  imports: [
    SiteModule,
    MediaModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
    HeroModule,
    AboutModule,
    CtaModule,
    StatisticsModule,
    FeaturesModule,
    FaqModule,
    SiteSettingsModule,
    NavigationModule,
    PagesModule,
    SeoModule,
    NewsModule,
    GalleryModule,
    TestimonialsModule,
    TeachersModule,
    CampusesModule,
    PublicApiModule,
  ],
})
export class CmsModule {}
