import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NavigationItem } from './entities/navigation-item.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { LocaleResolverService } from '../../common/services/locale-resolver.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/** Public-facing shape — localized fields resolved, children nested. */
export interface PublicNavigationItem {
  id: string;
  label: string | null;
  url: string | null;
  sortOrder: number;
  children: PublicNavigationItem[];
}

/**
 * `NavigationService` — CMS-E.2. Extends `BaseContentService` for the
 * same create/findAll/findOne/update/remove/applyStatusTransition
 * primitives every content type gets, plus two things unique to a
 * self-referencing tree that no CMS-D/`SiteSettings` type needed:
 *
 * 1. **Tree assembly** (`findPublishedTree()`) — the public controller
 *    doesn't want a flat list of rows, it wants a nested menu; this
 *    method fetches every `PUBLISHED` row for the Site in one query and
 *    assembles it into a tree in memory (bounded by however many
 *    navigation items one Site realistically has — no pagination
 *    concern the way a News/Gallery list would need).
 *
 * 2. **Per-parent ordering** (`reorder()`) — `OrderingService.reorder()`
 *    (CMS-C.4) only knows how to rewrite `sortOrder` across whatever
 *    id subset it's handed, re-validated by `siteId`; it has no concept
 *    of `parentId`. This method is what enforces "only ever reorder one
 *    sibling group at a time": it first confirms every id in the
 *    request actually shares the given `parentId` (or is a top-level
 *    row, when `parentId` is omitted) before delegating to
 *    `OrderingService`, so a caller can't accidentally interleave
 *    unrelated siblings into the same sort sequence.
 *
 * `reparent()` is the one write path with no equivalent in any CMS-D
 * type: moving a row to a different parent (or to top level). Guards
 * against creating a cycle (assigning a node as its own descendant's
 * parent) since the tree-assembly step would otherwise recurse forever.
 */
@Injectable()
export class NavigationService extends BaseContentService<NavigationItem> implements OnModuleInit {
  constructor(
    @InjectRepository(NavigationItem)
    repository: Repository<NavigationItem>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
    private readonly localeResolverService: LocaleResolverService,
  ) {
    super(repository, CmsEntityType.NAVIGATION_ITEM, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  async publish(siteId: string, id: string, userId: string): Promise<NavigationItem> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<NavigationItem> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(
    siteId: string,
    id: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<NavigationItem> {
    return this.publishingService.schedule(this, this.entityType, siteId, id, scheduledAt, userId);
  }

  async restore(
    siteId: string,
    id: string,
    revisionId: string,
    userId: string,
  ): Promise<NavigationItem> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<NavigationItem>;
    return this.update(
      siteId,
      id,
      {
        label: snapshot.label,
        url: snapshot.url ?? null,
      } as DeepPartial<NavigationItem>,
      userId,
    );
  }

  /**
   * Reorders one sibling group. `parentId` omitted/`null` reorders the
   * top-level items; otherwise reorders that parent's direct children.
   * Re-validates every id in `orderedIds` actually belongs to the given
   * parent scope (in addition to `OrderingService`'s own `siteId`
   * re-check) before delegating — see class doc comment.
   */
  async reorder(
    siteId: string,
    parentId: string | null | undefined,
    orderedIds: string[],
    userId: string,
  ): Promise<void> {
    if (orderedIds.length === 0) {
      return;
    }

    const normalizedParentId = parentId ?? null;

    const siblings = await this.repository.find({
      where: { siteId, parentId: normalizedParentId } as any,
    });
    const siblingIds = new Set(siblings.map((row) => row.id));

    const allBelongToParent = orderedIds.every((id) => siblingIds.has(id));
    if (!allBelongToParent || orderedIds.length !== siblingIds.size) {
      throw new BadRequestException(
        'orderedIds must exactly match the set of items under the given parent',
      );
    }

    return this.orderingService.reorder(
      this.getRepository(),
      this.entityType,
      siteId,
      orderedIds,
      userId,
    );
  }

  /**
   * Moves an item to a new parent (or to top level when `newParentId`
   * is omitted). Rejects assigning an item as its own parent, and
   * rejects assigning any of the item's own descendants as its new
   * parent — either would create a cycle the tree-assembly walk can't
   * terminate on.
   */
  async reparent(
    siteId: string,
    id: string,
    newParentId: string | null | undefined,
    userId: string,
  ): Promise<NavigationItem> {
    const entity = await this.findOne(siteId, id);
    const normalizedParentId = newParentId ?? null;

    if (normalizedParentId === id) {
      throw new BadRequestException('An item cannot be its own parent');
    }

    if (normalizedParentId) {
      const newParent = await this.repository.findOne({
        where: { id: normalizedParentId, siteId } as any,
      });
      if (!newParent) {
        throw new NotFoundException('Parent navigation item not found');
      }

      const descendantIds = await this.collectDescendantIds(siteId, id);
      if (descendantIds.has(normalizedParentId)) {
        throw new BadRequestException('Cannot move an item under its own descendant');
      }
    }

    entity.parentId = normalizedParentId;
    entity.updatedById = userId;
    const saved = await this.repository.save(entity);
    await this.snapshotRevision(saved, userId);

    return saved;
  }

  /** `GET /cms/public/navigation` — assembled tree of every `PUBLISHED` row. */
  async findPublishedTree(siteId: string, requestedLocale?: string): Promise<PublicNavigationItem[]> {
    const locale = await this.localeResolverService.resolve(siteId, requestedLocale);
    const defaultLocale = await this.localeResolverService.resolve(siteId);

    const rows = await this.repository.find({
      where: { siteId, status: ContentStatus.PUBLISHED } as any,
      order: { sortOrder: 'ASC' } as any,
    });

    const byParent = new Map<string | null, NavigationItem[]>();
    for (const row of rows) {
      const key = row.parentId ?? null;
      const bucket = byParent.get(key) ?? [];
      bucket.push(row);
      byParent.set(key, bucket);
    }

    const build = (parentId: string | null): PublicNavigationItem[] => {
      const children = byParent.get(parentId) ?? [];
      return children.map((row) => ({
        id: row.id,
        label: this.localeResolverService.resolveText(row.label, locale, defaultLocale),
        url: row.url,
        sortOrder: row.sortOrder,
        children: build(row.id),
      }));
    };

    return build(null);
  }

  private async collectDescendantIds(siteId: string, rootId: string): Promise<Set<string>> {
    const all = await this.repository.find({ where: { siteId } as any });
    const childrenByParent = new Map<string, string[]>();
    for (const row of all) {
      if (!row.parentId) continue;
      const bucket = childrenByParent.get(row.parentId) ?? [];
      bucket.push(row.id);
      childrenByParent.set(row.parentId, bucket);
    }

    const descendants = new Set<string>();
    const queue = [...(childrenByParent.get(rootId) ?? [])];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (descendants.has(current)) continue;
      descendants.add(current);
      queue.push(...(childrenByParent.get(current) ?? []));
    }

    return descendants;
  }
}
