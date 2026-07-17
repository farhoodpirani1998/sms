import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other CMS-D type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/faq` — site scope plus the shared paging shape. */
export class FaqListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /public/faq` — public read scope, locale-resolved. `siteId` no longer
 * travels here as of CMS-I.3 — `PublicSiteContextGuard` resolves the
 * Site from the `Host` header (or dev slug fallback) instead. */
export class PublicFaqQueryDto extends LocaleQueryDto {}

/** `POST /cms/faq/:id/schedule` body. */
export class ScheduleFaqDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/faq/reorder` body — same list-type ordering as `Statistic`'s/`Feature`'s. */
export class ReorderFaqDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
