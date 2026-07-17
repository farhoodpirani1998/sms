import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other CMS-D type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/statistics` — site scope plus the shared paging shape. */
export class StatisticListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/public/statistics` — public read scope, locale-resolved. `siteId` no longer
 * travels here as of CMS-I.3 — `PublicSiteContextGuard` resolves the
 * Site from the `Host` header (or dev slug fallback) instead. */
export class PublicStatisticQueryDto extends LocaleQueryDto {}

/** `POST /cms/statistics/:id/schedule` body. */
export class ScheduleStatisticDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/**
 * `POST /cms/statistics/reorder` body — the first real (non-proof)
 * content type where this route is expected to see actual use, per the
 * roadmap's D.4 handoff note (a Site's stats row is inherently ordered).
 */
export class ReorderStatisticDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
