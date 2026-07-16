import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentRevision } from './entities/content-revision.entity';
import { RevisionsService } from './revisions.service';
import { RevisionsController } from './revisions.controller';

/**
 * CMS-C.1 registered `ContentRevision` with TypeORM (module skeleton
 * only, no logic). CMS-C.2 adds `RevisionsService` (generic snapshot/
 * list/restore) and `RevisionsController` (the shared
 * `GET/POST /cms/:entityType/:id/revisions...` endpoints every content
 * type will use). `RevisionsService` is exported so
 * `BaseContentService` (CMS-C.3) can inject it directly instead of
 * re-declaring a `ContentRevision` repository.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ContentRevision])],
  controllers: [RevisionsController],
  providers: [RevisionsService],
  exports: [RevisionsService],
})
export class RevisionsModule {}
