import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other content type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/gallery` — site scope plus the shared paging shape and an optional `?category=` filter. */
export class GalleryListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}

/** `GET /cms/public/gallery` — public read scope, locale-resolved, same
 * optional `?category=` filter. `siteId` no longer travels here as of
 * CMS-I.5 — `PublicSiteContextGuard` resolves the Site from the `Host`
 * header (or dev slug fallback) instead. */
export class PublicGalleryQueryDto extends LocaleQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}

/** `POST /cms/gallery/:id/schedule` body. */
export class ScheduleGalleryItemDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/gallery/reorder` body — same shape as every other list type's. */
export class ReorderGalleryItemsDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
