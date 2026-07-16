import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, In, Repository } from 'typeorm';
import { BaseCmsEntity } from '../../common/entities/base-cms.entity';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { CMS_DOMAIN_EVENTS, ContentReorderedEvent } from '../events/cms-domain-events';

/**
 * `OrderingService` — CMS-C.4. `reorder()` is generic over
 * `CmsEntityType` the same way `RevisionsService`/`PublishingService`
 * are: it takes the caller's own repository rather than injecting one,
 * since no concrete content table exists until CMS-C.5. Every
 * `content/*` service (CMS-D onward) calls
 * `orderingService.reorder(this.getRepository(), ...)` — `getRepository()`
 * is `BaseContentService`'s ordering hook (CMS-C.3).
 *
 * Per docs/architecture/CMS_ARCHITECTURE.md §4.5: "Ordering is naturally
 * Site-scoped since it only ever operates on ids the caller already
 * resolved within one Site" — `reorder()` still re-validates every id
 * belongs to the given `siteId` inside the transaction rather than
 * trusting the caller, the same "don't trust a bare id" rule
 * `BaseContentService` follows for every other method.
 */
@Injectable()
export class OrderingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
  ) {}

  async reorder<T extends BaseCmsEntity>(
    repository: Repository<T>,
    entityType: CmsEntityType,
    siteId: string,
    orderedIds: string[],
    userId: string,
  ): Promise<void> {
    if (orderedIds.length === 0) {
      return;
    }

    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must not contain duplicates');
    }

    await this.dataSource.transaction(async (manager) => {
      const txRepository = manager.withRepository(repository);

      const rows = await txRepository.find({
        where: { id: In(orderedIds), siteId } as any,
      });

      if (rows.length !== orderedIds.length) {
        throw new BadRequestException(
          'One or more ids do not exist for this Site — reorder was not applied',
        );
      }

      await Promise.all(
        orderedIds.map((id, index) =>
          txRepository.update({ id, siteId } as any, { sortOrder: index } as any),
        ),
      );
    });

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_REORDERED,
      new ContentReorderedEvent(entityType, siteId, orderedIds, userId),
    );
  }
}
