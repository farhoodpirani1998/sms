import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other content type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/pages` — site scope plus the shared paging shape. */
export class PageListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/**
 * `GET /cms/public/pages/:slug` — public read scope, locale-resolved.
 * Lands in CMS-F.2 alongside `PagesPublicController`; kept here now
 * since it's the natural home next to every other query DTO in this
 * file, matching how `PublicStatisticQueryDto` sits in
 * `statistic-query.dto.ts` rather than a separate file.
 */
export class PublicPageQueryDto extends LocaleQueryDto {
  @IsUUID()
  siteId: string;
}

/** `POST /cms/pages/:id/schedule` body. */
export class SchedulePageDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/pages/reorder` body — same shape as every other list type's. */
export class ReorderPagesDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
