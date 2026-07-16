import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { SiteResolverService } from './site-resolver.service';

// CMS-A.1: the first core/ sub-module. Exports SiteService so later CMS
// phases (content modules needing to resolve/validate a siteId) can
// inject it without each re-declaring their own Site repository.
// SiteResolverService (CMS-A.3 stub, domain-lookup only) is exported too
// so CMS-I.1 can wire the real Host-header guard on top of it without
// re-declaring the Site repository either.
@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [SiteController],
  providers: [SiteService, SiteResolverService],
  exports: [SiteService, SiteResolverService],
})
export class SiteModule {}
