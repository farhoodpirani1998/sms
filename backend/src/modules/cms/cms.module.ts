import { Module } from '@nestjs/common';
import { SiteModule } from './core/site/site.module';
import { MediaModule } from './core/media/media.module';
import { RevisionsModule } from './core/revisions/revisions.module';

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
 * service emits/listens to it until CMS-C.2 onward). The rest of `core/*`
 * (publishing, ordering, seo, i18n, public-api) and all of `content/*`
 * land in later phases and get added to this `imports` array as they're
 * built — this module is intentionally left open for that rather than
 * pre-declaring empty placeholder modules for work that hasn't started
 * yet.
 *
 * `CmsModule` must never import `SchoolModule`/`SchoolsModule`, and no
 * CMS provider may inject a School repository or service — that's the
 * enforcement point for "CMS is a bounded context separate from School"
 * (architecture §1/§7).
 */
@Module({
  imports: [SiteModule, MediaModule, RevisionsModule],
})
export class CmsModule {}
