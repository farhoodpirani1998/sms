import { IsObject, IsOptional, IsUUID } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateCampusDto` / `UpdateCampusDto` — CMS-H.4. Same shape every
 * prior content type's DTO pair established: `siteId` required on
 * create and immutable after (updates scope via `SiteIdQueryDto`'s
 * `?siteId=`). All three content fields (`name`/`address`/`description`)
 * are `LocalizedText` and only shape-checked (`@IsObject()`), same as
 * every other `LocalizedText` field in this module — see the entity's
 * doc comment for why even `name`/`address` get this treatment here,
 * unlike `TeacherProfile.name`/`Testimonial.authorName`. `name` is
 * required on create (`NOT NULL` in the migration); `address`/
 * `description` are optional on both create and update.
 */
export class CreateCampusDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  name: LocalizedText;

  @IsOptional()
  @IsObject()
  address?: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;
}

export class UpdateCampusDto {
  @IsOptional()
  @IsObject()
  name?: LocalizedText;

  @IsOptional()
  @IsObject()
  address?: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;
}
