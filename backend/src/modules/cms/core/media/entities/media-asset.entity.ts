import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Site } from '../../site/entities/site.entity';

/**
 * `MediaAsset` — CMS-B.1. Uploaded-file record (schema `cms`), scoped by
 * Site per docs/architecture/CMS_ARCHITECTURE.md §4.7. Field list matches
 * the architecture doc exactly: id, siteId, originalFilename, mimeType,
 * sizeBytes, storageKey, url, width, height, altText, uploadedById,
 * createdAt.
 *
 * Deliberately does NOT extend `BaseCmsEntity` — a MediaAsset isn't
 * "publishable content" (no status/sortOrder/publishedAt lifecycle); it's
 * infrastructure that content entities reference by id (e.g.
 * `coverMediaId` on NewsArticle, §4.1). No `updatedAt` either: a
 * MediaAsset's binary is immutable once uploaded — replacing the file
 * means uploading a new asset, not editing this row.
 *
 * `storageKey` vs `url`: `storageKey` is the StorageProvider-internal path
 * (namespaced `sites/{siteId}/...` starting at CMS-B.3), `url` is what's
 * actually served to clients — kept as two columns so switching storage
 * drivers later doesn't require rewriting `url` on existing rows.
 *
 * No logic yet (StorageProvider, upload endpoint, service) — those land
 * in CMS-B.2 through CMS-B.4. This sub-phase only lands the table, the
 * entity, and an empty module.
 */
@Entity({ name: 'media_assets', schema: 'cms' })
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 127 })
  mimeType: string;

  @Column({
    name: 'size_bytes',
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  sizeBytes: number;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ name: 'alt_text', type: 'varchar', length: 500, nullable: true })
  altText: string | null;

  @Column({ name: 'uploaded_by_id', type: 'uuid', nullable: true })
  uploadedById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
