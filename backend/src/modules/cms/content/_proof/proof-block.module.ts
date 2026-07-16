import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProofBlock } from './entities/proof-block.entity';
import { ProofBlockService } from './proof-block.service';
import { ProofBlockController } from './proof-block.controller';
import { RevisionsModule } from '../../core/revisions/revisions.module';
import { PublishingModule } from '../../core/publishing/publishing.module';
import { OrderingModule } from '../../core/ordering/ordering.module';

/**
 * `ProofBlockModule` — CMS-C.5. Imports every core module
 * `ProofBlockService` needs injected (`RevisionsModule` for
 * `RevisionsService`, `PublishingModule` for `PublishingService`,
 * `OrderingModule` for `OrderingService`) — the same import shape every
 * real `content/*` module (CMS-D onward) will need, since all three are
 * cross-cutting concerns every content type uses, not just this one.
 *
 * Not exported: nothing outside this module needs `ProofBlockService` or
 * the `ProofBlock` repository — unlike `SiteModule`/`MediaModule`, no
 * other CMS module depends on the proof entity.
 *
 * Per the roadmap's CMS-C.5 handoff note: recommend deleting this whole
 * module (and its `cms.module.ts` import) before CMS-D.1 starts, once
 * the cross-cutting stack is confirmed to need no changes.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProofBlock]),
    RevisionsModule,
    PublishingModule,
    OrderingModule,
  ],
  controllers: [ProofBlockController],
  providers: [ProofBlockService],
})
export class ProofBlockModule {}
