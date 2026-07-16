import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentRevision } from './entities/content-revision.entity';

/**
 * CMS-C.1 — Publishing + Revisions + Events, module skeleton only.
 * Registers `ContentRevision` with TypeORM; no service or controller yet
 * (`RevisionsService`/`RevisionsController` land in CMS-C.2, which will
 * edit this file to add and export them) — same "table + empty module,
 * logic lands next sub-phase" shape `MediaModule` used at CMS-B.1.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ContentRevision])],
})
export class RevisionsModule {}
