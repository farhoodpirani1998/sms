import { Module } from '@nestjs/common';
import { SiteModule } from './core/site/site.module';

/**
 * Aggregates every `core/*` and `content/*` CMS sub-module. Imported once
 * in AppModule (see docs/architecture/CMS_ARCHITECTURE.md §7) — nothing
 * else in the existing app changes.
 *
 * CMS-A.1 only wires up `core/site` (schema + Site entity/CRUD). The rest
 * of `core/*` (media, publishing, revisions, ordering, seo, i18n, events,
 * public-api) and all of `content/*` land in later CMS-A/B/C+ phases and
 * get added to this `imports` array as they're built — this module is
 * intentionally left open for that rather than pre-declaring empty
 * placeholder modules for work that hasn't started yet.
 *
 * `CmsModule` must never import `SchoolModule`/`SchoolsModule`, and no
 * CMS provider may inject a School repository or service — that's the
 * enforcement point for "CMS is a bounded context separate from School"
 * (architecture §1/§7).
 */
@Module({
  imports: [SiteModule],
})
export class CmsModule {}
