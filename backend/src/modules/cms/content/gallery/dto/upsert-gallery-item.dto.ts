import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateGalleryItemDto` / `UpdateGalleryItemDto` — CMS-H.1. Same shape
 * every prior content type's DTO pair established: `siteId` required on
 * create and immutable after (updates scope via `SiteIdQueryDto`'s
 * `?siteId=`). `mediaId` is the one field with no equivalent on any
 * CMS-D/E/F/G type's create DTO — required (not `@IsOptional()`) since
 * `GalleryItem.media` is a required relation, unlike every other type's
 * optional `coverMediaId`. `caption`/`category` are optional, same
 * "format here, business rule (existence of the referenced MediaAsset)
 * in the service" split every other media reference follows.
 */
export class CreateGalleryItemDto {
  @IsUUID()
  siteId: string;

  @IsUUID()
  mediaId: string;

  @IsOptional()
  @IsObject()
  caption?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}

export class UpdateGalleryItemDto {
  @IsOptional()
  @IsUUID()
  mediaId?: string;

  @IsOptional()
  @IsObject()
  caption?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
