import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as `Hero`'s/`About`'s. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/cta` — site scope plus the shared paging shape. */
export class CtaListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /public/cta` — public read scope, locale-resolved. `siteId` no longer
 * travels here as of CMS-I.3 — `PublicSiteContextGuard` resolves the
 * Site from the `Host` header (or dev slug fallback) instead. */
export class PublicCtaQueryDto extends LocaleQueryDto {}

/** `POST /cms/cta/:id/schedule` body. */
export class ScheduleCtaDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/cta/reorder` body. */
export class ReorderCtaDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
