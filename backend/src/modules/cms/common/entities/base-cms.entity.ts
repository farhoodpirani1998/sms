import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentStatus } from '../enums/content-status.enum';

/**
 * Shared base for every CMS content-type entity (§4.1 of
 * docs/architecture/CMS_ARCHITECTURE.md). Abstract — never given its own
 * `@Entity()`/table; a concrete content type extends this and adds its
 * own `@Entity({ schema: 'cms' })`, its own fields, and a `@ManyToOne(()
 * => Site)` relation on `siteId` (the FK itself is declared in that
 * entity/migration, not here, since TypeORM can't add a relation
 * decorator on an abstract base column pointing at a concrete target).
 *
 * `createdById` / `updatedById` reference the existing `User` entity —
 * that's the one and only cross-module reference any CMS entity has,
 * and it points at Users, never at School.
 *
 * This is CMS-A.2 scaffolding only. No content type extends it yet
 * (that starts at CMS-D) — nothing here is backed by a migration.
 */
export abstract class BaseCmsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string | null;

  @Column({ name: 'updated_by_id', nullable: true })
  updatedById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
