import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from './entities/campus.entity';
import { CampusesService } from './campuses.service';
import { CampusesController } from './campuses.controller';
import { CampusesPublicController } from './campuses-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';
import { PublicApiModule } from '../../core/public-api/public-api.module';

/**
 * `CampusesModule` — CMS-H.4. Same cross-cutting imports every content
 * module needs (`RevisionsModule`, `PublishingModule`, `OrderingModule`,
 * `SiteModule` for `LocaleResolverService`). Last of the fourteen CMS
 * content types. Not exported — nothing outside this module needs
 * `CampusesService`.
 *
 * CMS-I.5 adds `PublicApiModule` so the public controller can
 * `@UseGuards(PublicSiteContextGuard)`/`@UseInterceptors(PublicCacheInterceptor)`
 * — Site is now resolved from the `Host` header instead of `?siteId=`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Campus]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
    PublicApiModule,
  ],
  controllers: [CampusesController, CampusesPublicController],
  providers: [CampusesService, LocaleResolverService],
})
export class CampusesModule {}
