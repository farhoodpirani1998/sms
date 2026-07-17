import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/**
 * `UpdateSiteSettingsDto` — CMS-E.1. No `CreateSiteSettingsDto` exists
 * (unlike every CMS-D type) — the singleton row is never created from a
 * client-supplied payload; `SiteSettingsService.getOrCreate()` creates
 * it with all-null/default fields the first time it's needed, and every
 * client-facing write is a `PATCH` against that row through this DTO.
 * `siteId` isn't a field here either — it's the `?siteId=` query param
 * every `SiteSettingsController` route takes, same scoping convention
 * as `SiteIdQueryDto` elsewhere in the module.
 *
 * The roadmap lists a single DTO file for this sub-phase (unlike CMS-D's
 * `*-query.dto.ts` + `upsert-*.dto.ts` pair) — the query/schedule/
 * restore DTOs below live here too rather than in a second file, since
 * there's no create DTO to pair a query file against.
 */
export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsObject()
  footerText?: LocalizedText;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  contactAddress?: LocalizedText;

  @IsOptional()
  @IsObject()
  copyrightText?: LocalizedText;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  analyticsId?: string;
}

/** `?siteId=` scoping — every `SiteSettingsController` route uses this, no `:id` param needed. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/public/site-settings` — public read scope, locale-resolved. */
export class PublicSiteSettingsQueryDto extends LocaleQueryDto {}

/** `POST /cms/site-settings/schedule` body. */
export class ScheduleSiteSettingsDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/site-settings/restore` body — no `:id` (resolved from the singleton row internally). */
export class RestoreSiteSettingsDto {
  @IsUUID()
  siteId: string;

  @IsUUID()
  revisionId: string;
}
