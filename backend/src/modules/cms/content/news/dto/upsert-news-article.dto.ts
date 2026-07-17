import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/** `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` — lowercase, hyphen-separated, URL-safe. Same as Pages. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * `CreateNewsArticleDto` / `UpdateNewsArticleDto` — CMS-G.1. Same shape
 * as `CreatePageDto`/`UpdatePageDto` (CMS-F.1): `siteId` required on
 * create and immutable after (updates scope via `SiteIdQueryDto`'s
 * `?siteId=`), `slug` shape-validated here (`SLUG_PATTERN`) with
 * uniqueness enforced by `NewsService`, not this DTO. `coverMediaId`
 * replaces Pages' `ogImageMediaId` per the entity's naming convention.
 */
export class CreateNewsArticleDto {
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
  coverMediaId?: string;
}

export class UpdateNewsArticleDto {
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
  coverMediaId?: string;
}
