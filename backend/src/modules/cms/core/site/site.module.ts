import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';

// CMS-A.1: the first core/ sub-module. Exports SiteService so later CMS
// phases (content modules needing to resolve/validate a siteId, the
// public-api Host-header resolver in CMS-I) can inject it without each
// re-declaring their own Site repository.
@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
