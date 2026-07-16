import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Page } from './entities/page.entity';
import { BaseContentService } from '../../common/services/base-content.service';
import { CmsEntityType } from '../../common/enums/cms-entity-type.enum';
import { RevisionsService } from '../../core/revisions/revisions.service';
import { PublishingService } from '../../core/publishing/publishing.service';
import { OrderingService } from '../../core/ordering/ordering.service';

/**
 * `PagesService` — CMS-F.1. Extends `BaseContentService` for the same
 * create/findAll/findOne/update/remove/applyStatusTransition primitives
 * every content type gets, plus one thing no CMS-D/E type needed: slug
 * uniqueness. The DB's `UNIQUE (site_id, slug)` constraint (this
 * sub-phase's migration) is the actual enforcement point; `create()`/
 * `update()` here re-check first so a duplicate slug surfaces as a
 * clear `ConflictException` rather than a raw Postgres error bubbling
 * up through `save()`.
 *
 * Same `publish`/`unpublish`/`schedule`/`reorder`/`restore` wrappers and
 * `onModuleInit()` self-registration with `PublishingService` as every
 * other content type — public by-slug lookup (`findPublishedBySlug`)
 * and the shared `core/seo/` module land in CMS-F.2.
 */
@Injectable()
export class PagesService extends BaseContentService<Page> implements OnModuleInit {
  constructor(
    @InjectRepository(Page)
    repository: Repository<Page>,
    revisionsService: RevisionsService,
    events: EventEmitter2,
    private readonly publishingService: PublishingService,
    private readonly orderingService: OrderingService,
  ) {
    super(repository, CmsEntityType.PAGE, revisionsService, events);
  }

  onModuleInit(): void {
    this.publishingService.registerSchedulable({
      entityType: this.entityType,
      repository: this.repository,
      contentService: this,
    });
  }

  override async create(siteId: string, data: DeepPartial<Page>, userId: string): Promise<Page> {
    if (data.slug) {
      await this.assertSlugAvailable(siteId, data.slug as string);
    }
    return super.create(siteId, data, userId);
  }

  override async update(
    siteId: string,
    id: string,
    data: DeepPartial<Page>,
    userId: string,
  ): Promise<Page> {
    if (data.slug) {
      await this.assertSlugAvailable(siteId, data.slug as string, id);
    }
    return super.update(siteId, id, data, userId);
  }

  private async assertSlugAvailable(
    siteId: string,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.repository.findOne({ where: { siteId, slug } as any });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`A page with slug "${slug}" already exists for this Site`);
    }
  }

  async publish(siteId: string, id: string, userId: string): Promise<Page> {
    return this.publishingService.publish(this, this.entityType, siteId, id, userId);
  }

  async unpublish(siteId: string, id: string, userId: string): Promise<Page> {
    return this.publishingService.unpublish(this, this.entityType, siteId, id, userId);
  }

  async schedule(siteId: string, id: string, scheduledAt: Date, userId: string): Promise<Page> {
    return this.publishingService.schedule(this, this.entityType, siteId, id, scheduledAt, userId);
  }

  async reorder(siteId: string, orderedIds: string[], userId: string): Promise<void> {
    return this.orderingService.reorder(
      this.getRepository(),
      this.entityType,
      siteId,
      orderedIds,
      userId,
    );
  }

  async restore(siteId: string, id: string, revisionId: string, userId: string): Promise<Page> {
    const revision = await this.revisionsService.restore(this.entityType, id, revisionId, userId);

    // Same "never trust a bare id" re-check every other content service
    // performs — `RevisionsService.restore()` doesn't scope by siteId.
    if (revision.siteId !== siteId) {
      throw new NotFoundException('Revision not found');
    }

    const snapshot = revision.snapshot as Partial<Page>;
    if (snapshot.slug) {
      await this.assertSlugAvailable(siteId, snapshot.slug, id);
    }

    return this.update(
      siteId,
      id,
      {
        slug: snapshot.slug,
        title: snapshot.title,
        excerpt: snapshot.excerpt ?? null,
        body: snapshot.body ?? null,
        metaTitle: snapshot.metaTitle ?? null,
        metaDescription: snapshot.metaDescription ?? null,
        ogImageMediaId: snapshot.ogImageMediaId ?? null,
      } as DeepPartial<Page>,
      userId,
    );
  }
}
