import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/**
 * `SiteIdQueryDto` — CMS-D.1. `?siteId=` scoping for every single-record
 * admin action that only has an `:id` route param to work with, same
 * precedent `ProofBlock`'s `SiteIdQueryDto` (CMS-C.5) set — every
 * `content/*` module from here on declares its own copy rather than
 * sharing one across modules, since each module's DTOs are otherwise
 * self-contained (no cross-content-type imports).
 */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/hero` — site scope plus the shared paging shape. */
export class HeroListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/**
 * `GET /cms/public/hero` — public read scope. `locale` is optional and
 * resolved against the Site's supported locales by `LocaleResolverService`
 * (falls back to the Site's `defaultLocale` when omitted or unsupported).
 */
export class PublicHeroQueryDto extends LocaleQueryDto {
  @IsUUID()
  siteId: string;
}

/** `POST /cms/hero/:id/schedule` body. */
export class ScheduleHeroDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/**
 * `POST /cms/hero/reorder` body — no `:id` route param (it reorders many
 * rows at once), so `siteId` lives in the body alongside `orderedIds`
 * rather than as a query param.
 */
export class ReorderHeroDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
