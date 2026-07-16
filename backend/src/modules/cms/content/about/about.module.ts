import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { About } from './entities/about.entity';
import { AboutService } from './about.service';
import { AboutController } from './about.controller';
import { AboutPublicController } from './about-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `AboutModule` — CMS-D.2. Copies `HeroModule` (CMS-D.1) 1:1: same
 * cross-cutting imports plus `SiteModule` for `LocaleResolverService`.
 * Not exported — nothing outside this module needs `AboutService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([About]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [AboutController, AboutPublicController],
  providers: [AboutService, LocaleResolverService],
})
export class AboutModule {}
