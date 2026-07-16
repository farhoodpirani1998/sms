import { IsUUID } from 'class-validator';

/**
 * `RestoreRevisionDto` — CMS-C.2. `entityType`/`entityId` already come
 * from the URL (`POST /cms/:entityType/:id/revisions/restore`); the only
 * thing the body needs to carry is which revision to restore.
 */
export class RestoreRevisionDto {
  @IsUUID()
  revisionId: string;
}
