import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { normalizePagination, PaginationParams } from '../../../../common/utils/pagination';
import { BaseCmsEntity } from '../entities/base-cms.entity';
import { CmsEntityType } from '../enums/cms-entity-type.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import {
  CMS_DOMAIN_EVENTS,
  ContentCreatedEvent,
  ContentDeletedEvent,
  ContentUpdatedEvent,
} from '../../core/events/cms-domain-events';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * `BaseContentService` — CMS-C.3. The generic base every `content/*`
 * service (Hero, About, News, ... — CMS-D through CMS-H) extends instead
 * of hand-rolling its own create/list/read/update/delete against
 * `BaseCmsEntity` (§4.1 of docs/architecture/CMS_ARCHITECTURE.md). Proven
 * against a real subclass in CMS-C.5 (the throwaway `ProofBlock` entity)
 * before 14 real content types copy the pattern from CMS-D onward — this
 * sub-phase itself is verified with an in-memory fake repository, since
 * no concrete content type/table exists yet.
 *
 * A subclass supplies its own injected `Repository<T>` (TypeORM can't
 * inject a repository generically) and its own `CmsEntityType` member,
 * then calls `super(...)`:
 *
 * ```ts
 * @Injectable()
 * export class HeroService extends BaseContentService<Hero> {
 *   constructor(
 *     @InjectRepository(Hero) repository: Repository<Hero>,
 *     revisionsService: RevisionsService,
 *     events: EventEmitter2,
 *   ) {
 *     super(repository, CmsEntityType.HERO, revisionsService, events);
 *   }
 * }
 * ```
 *
 * **Revision hooks:** `create()`/`update()` snapshot the saved row via
 * `RevisionsService.snapshot()` (CMS-C.2) after every write — the same
 * "restoring is itself a new edit" history `RevisionsService` already
 * assumes. **Publish hooks:** `applyStatusTransition()` is the one
 * low-level primitive `PublishingService` (CMS-C.4) calls to actually
 * flip `status`/`publishedAt`/`scheduledAt` and snapshot the result;
 * deciding *when* that's allowed, which of the three specific
 * `CONTENT_PUBLISHED`/`UNPUBLISHED`/`SCHEDULED` events to emit, and
 * calling `AuditService.record()` are `PublishingService`'s job, not
 * this class's — kept separate so "what changed on the row" (here)
 * doesn't get tangled with "who should be told, and is this auditable"
 * (CMS-C.4). **Ordering hook:** `getRepository()` is what
 * `OrderingService.reorder()` (CMS-C.4) will operate against — reorder
 * logic itself deliberately isn't implemented here, since it's one
 * transactional operation shared by every content type rather than
 * something to inherit per-type.
 *
 * Every method here is scoped by `siteId` (never trusts a bare `id`
 * alone), matching every other CMS core service's tenancy rule.
 *
 * These public method signatures are now frozen for CMS-D onward.
 */
export abstract class BaseContentService<T extends BaseCmsEntity> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityType: CmsEntityType,
    protected readonly revisionsService: RevisionsService,
    protected readonly events: EventEmitter2,
  ) {}

  async create(siteId: string, data: DeepPartial<T>, userId: string): Promise<T> {
    const entity = this.repository.create({
      ...data,
      siteId,
      createdById: userId,
      updatedById: userId,
    } as DeepPartial<T>);

    const saved = await this.repository.save(entity);
    await this.snapshotRevision(saved, userId);

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_CREATED,
      new ContentCreatedEvent(this.entityType, saved.id, saved.siteId, userId),
    );

    return saved;
  }

  async findAll(siteId: string, pagination: PaginationParams = {}): Promise<PaginatedResult<T>> {
    const { page, limit, skip } = normalizePagination(pagination);

    const [data, total] = await this.repository.findAndCount({
      where: { siteId } as FindOptionsWhere<T>,
      order: { sortOrder: 'ASC', createdAt: 'DESC' } as any,
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(siteId: string, id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id, siteId } as FindOptionsWhere<T>,
    });

    if (!entity) {
      throw new NotFoundException(`${this.entityType} not found`);
    }

    return entity;
  }

  async update(siteId: string, id: string, data: DeepPartial<T>, userId: string): Promise<T> {
    const entity = await this.findOne(siteId, id);

    Object.assign(entity, data, { updatedById: userId });
    const saved = await this.repository.save(entity);
    await this.snapshotRevision(saved, userId);

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_UPDATED,
      new ContentUpdatedEvent(this.entityType, saved.id, saved.siteId, userId),
    );

    return saved;
  }

  async remove(siteId: string, id: string, userId: string): Promise<void> {
    const entity = await this.findOne(siteId, id);
    await this.repository.remove(entity);

    this.events.emit(
      CMS_DOMAIN_EVENTS.CONTENT_DELETED,
      new ContentDeletedEvent(this.entityType, id, siteId, userId),
    );
  }

  /**
   * Publish hook (CMS-C.3, called by `PublishingService` from CMS-C.4
   * onward). Flips whichever of `status`/`publishedAt`/`scheduledAt` the
   * caller passes, saves, and snapshots the result as a new revision —
   * nothing more. `performedBy` is nullable here (unlike `create()`/
   * `update()`/`remove()`) because the scheduled-publish cron (CMS-C.4)
   * calls this with no acting user.
   */
  async applyStatusTransition(
    siteId: string,
    id: string,
    patch: Partial<Pick<T, 'status' | 'publishedAt' | 'scheduledAt'>>,
    userId: string | null,
  ): Promise<T> {
    const entity = await this.findOne(siteId, id);

    Object.assign(entity, patch);
    if (userId) {
      entity.updatedById = userId;
    }

    const saved = await this.repository.save(entity);
    await this.snapshotRevision(saved, userId);

    return saved;
  }

  /**
   * Ordering hook (CMS-C.3). `OrderingService.reorder()` (CMS-C.4)
   * operates directly on the repository a concrete content service hands
   * it, rather than reimplementing a transactional `sort_order` rewrite
   * per content type.
   */
  getRepository(): Repository<T> {
    return this.repository;
  }

  protected async snapshotRevision(entity: T, userId: string | null): Promise<void> {
    await this.revisionsService.snapshot(
      this.entityType,
      entity.id,
      entity.siteId,
      entity as unknown as Record<string, unknown>,
      userId,
    );
  }
}
