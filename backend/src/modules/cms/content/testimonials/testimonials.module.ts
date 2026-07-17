import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsPublicController } from './testimonials-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `TestimonialsModule` — CMS-H.2. Same cross-cutting imports every
 * content module needs (`RevisionsModule`, `PublishingModule`,
 * `OrderingModule`, `SiteModule` for `LocaleResolverService`). Not
 * exported — nothing outside this module needs `TestimonialsService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Testimonial]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [TestimonialsController, TestimonialsPublicController],
  providers: [TestimonialsService, LocaleResolverService],
})
export class TestimonialsModule {}
