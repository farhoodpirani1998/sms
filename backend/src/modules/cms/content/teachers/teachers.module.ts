import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeachersPublicController } from './teachers-public.controller';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { SiteModule } from '../../core/site/site.module';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `TeachersModule` — CMS-H.3. Same cross-cutting imports every content
 * module needs (`RevisionsModule`, `PublishingModule`, `OrderingModule`,
 * `SiteModule` for `LocaleResolverService`). Does not import, and must
 * never import, anything from `modules/school`/`modules/teacher` — see
 * `TeacherProfile`'s bounded-context note. Not exported — nothing
 * outside this module needs `TeachersService`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherProfile]),
    SiteModule,
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [TeachersController, TeachersPublicController],
  providers: [TeachersService, LocaleResolverService],
})
export class TeachersModule {}
