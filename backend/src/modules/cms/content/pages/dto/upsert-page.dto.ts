import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/** `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` — lowercase, hyphen-separated, URL-safe. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * `CreatePageDto` / `UpdatePageDto` — CMS-F.1. Same shape every prior
 * content type's DTO pair established: `siteId` required on create and
 * immutable after (updates scope via `SiteIdQueryDto`'s `?siteId=`).
 * `slug` is the one field with no equivalent elsewhere in the module —
 * shape-validated here (`SLUG_PATTERN`) but uniqueness is
 * `PagesService`'s job, not this DTO's, same "format here, business
 * rule in the service" split every other field follows.
 */
export class CreatePageDto {
  @IsUUID()
  siteId: string;

  @IsString()
  @MaxLength(255)
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase, alphanumeric, and hyphen-separated',
  })
  slug: string;

  @IsObject()
  title: LocalizedText;

  @IsOptional()
  @IsObject()
  excerpt?: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;

  @IsOptional()
  @IsObject()
  metaTitle?: LocalizedText;

  @IsOptional()
  @IsObject()
  metaDescription?: LocalizedText;

  @IsOptional()
  @IsUUID()
  ogImageMediaId?: string;
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase, alphanumeric, and hyphen-separated',
  })
  slug?: string;

  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  excerpt?: LocalizedText;

  @IsOptional()
  @IsObject()
  body?: LocalizedText;

  @IsOptional()
  @IsObject()
  metaTitle?: LocalizedText;

  @IsOptional()
  @IsObject()
  metaDescription?: LocalizedText;

  @IsOptional()
  @IsUUID()
  ogImageMediaId?: string;
}
