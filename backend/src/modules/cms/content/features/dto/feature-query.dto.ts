import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other CMS-D type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/features` — site scope plus the shared paging shape. */
export class FeatureListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/public/features` — public read scope, locale-resolved. `siteId` no longer
 * travels here as of CMS-I.3 — `PublicSiteContextGuard` resolves the
 * Site from the `Host` header (or dev slug fallback) instead. */
export class PublicFeatureQueryDto extends LocaleQueryDto {}

/** `POST /cms/features/:id/schedule` body. */
export class ScheduleFeatureDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/features/reorder` body — same list-type ordering as `Statistic`'s. */
export class ReorderFeatureDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
