import { Module } from '@nestjs/common';
import { SiteModule } from './core/site/site.module';
import { MediaModule } from './core/media/media.module';
import { RevisionsModule } from './core/revisions/revisions.module';
import { PublishingModule } from './core/publishing/publishing.module';
import { OrderingModule } from './core/ordering/ordering.module';
import { ProofBlockModule } from './content/_proof/proof-block.module';
import { HeroModule } from './content/hero/hero.module';
import { AboutModule } from './content/about/about.module';

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
 * end-to-end. CMS-C.5 is that end-to-end proof: it imports both here for
 * the first time, alongside `ProofBlockModule` (`content/_proof/`), the
 * disposable content type that exercises the full CRUD → revision
 * snapshot → publish → event → audit pipeline before 14 real content
 * types (CMS-D onward) copy the same shape. `ProofBlockModule` is
 * expected to be removed from this list (and deleted) once it's no
 * longer needed as a reference — left in place for now since removing
 * it isn't itself one of CMS-D.1's listed files, and nothing about it
 * conflicts with `HeroModule` — `PublishingModule`/`OrderingModule`
 * stay regardless, since every real content type needs them too.
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
 * The rest of `core/*` (seo, i18n, public-api) and the remaining 12 real
 * `content/*` types land in later phases and get added to this `imports`
 * array as they're built — this module is intentionally left open for
 * that rather than pre-declaring empty placeholder modules for work that
 * hasn't started yet.
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
    ProofBlockModule,
    HeroModule,
    AboutModule,
  ],
})
export class CmsModule {}
