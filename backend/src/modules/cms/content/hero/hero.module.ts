import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hero } from './entities/hero.entity';
import { HeroService } from './hero.service';
import { HeroController } from './hero.controller';
import { HeroPublicController } from './hero-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `HeroModule` — CMS-D.1. Same cross-cutting import shape
 * `ProofBlockModule` (CMS-C.5) established (`RevisionsModule`,
 * `PublishingModule`, `OrderingModule`), plus `SiteModule` — new here,
 * since `LocaleResolverService` (this module's one direct provider,
 * per its own "not registered in any module yet" doc comment) needs
 * `SiteService` injected. Every later `content/*` module that reads
 * localized fields for its public controller will need the same
 * `SiteModule` import + local `LocaleResolverService` provider.
 *
 * Not exported: nothing outside this module needs `HeroService` or the
 * `Hero` repository, matching `ProofBlockModule`'s "not exported" note.
 *
 * This is the reference implementation — D.2–D.6 copy this file 1:1
 * against the tables `CmsSimpleContent` (this sub-phase's migration)
 * already created for them.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Hero]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [HeroController, HeroPublicController],
  providers: [HeroService, LocaleResolverService],
})
export class HeroModule {}
