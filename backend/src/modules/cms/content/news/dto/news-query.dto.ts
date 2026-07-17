import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as Pages'. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/news` — site scope plus the shared paging shape. */
export class NewsListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/**
 * `GET /public/news` — CMS-G.2. Public listing scope: site + the
 * shared paging shape (`PaginationQueryDto`) + `?locale=`. News is the
 * first content type whose public read needs both pagination and
 * locale together — extends `PaginationQueryDto` and adds `locale`
 * directly (rather than `LocaleQueryDto`, since TS classes can't extend
 * two DTOs) using the same `@IsOptional`/`@Length(2, 10)` shape check
 * `LocaleQueryDto` itself uses.
 */
export class PublicNewsListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;
}

/** `GET /public/news/:slug` — public detail scope, locale-resolved. */
export class PublicNewsQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;
}

/** `POST /cms/news/:id/schedule` body. */
export class ScheduleNewsArticleDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/news/reorder` body — same shape as every other list type's. */
export class ReorderNewsArticlesDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
