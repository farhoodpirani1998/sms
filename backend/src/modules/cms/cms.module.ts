import { Module } from '@nestjs/common';
import { SiteModule } from './core/site/site.module';
import { MediaModule } from './core/media/media.module';

/**
 * Aggregates every `core/*` and `content/*` CMS sub-module. Imported once
 * in AppModule (see docs/architecture/CMS_ARCHITECTURE.md §7) — nothing
 * else in the existing app changes.
 *
 * CMS-A wired up `core/site` (schema + Site entity/CRUD). CMS-B.1 adds
 * `core/media` (table + empty module skeleton only — no
 * StorageProvider/service/controller yet, those land in CMS-B.2 through
 * CMS-B.4). The rest of `core/*` (publishing, revisions, ordering, seo,
 * i18n, events, public-api) and all of `content/*` land in later phases
 * and get added to this `imports` array as they're built — this module is
 * intentionally left open for that rather than pre-declaring empty
 * placeholder modules for work that hasn't started yet.
 *
 * `CmsModule` must never import `SchoolModule`/`SchoolsModule`, and no
 * CMS provider may inject a School repository or service — that's the
 * enforcement point for "CMS is a bounded context separate from School"
 * (architecture §1/§7).
 */
@Module({
  imports: [SiteModule, MediaModule],
})
export class CmsModule {}
