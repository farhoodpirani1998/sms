import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as `Hero`'s. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/about` — site scope plus the shared paging shape. */
export class AboutListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/public/about` — public read scope, locale-resolved. */
export class PublicAboutQueryDto extends LocaleQueryDto {
  @IsUUID()
  siteId: string;
}

/** `POST /cms/about/:id/schedule` body. */
export class ScheduleAboutDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/about/reorder` body. */
export class ReorderAboutDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
