import { ArrayNotEmpty, IsArray, IsDateString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other content type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/teachers` — site scope plus the shared paging shape. */
export class TeacherProfileListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/public/teachers` — public read scope, locale-resolved. */
export class PublicTeacherProfileQueryDto extends LocaleQueryDto {
  @IsUUID()
  siteId: string;
}

/** `POST /cms/teachers/:id/schedule` body. */
export class ScheduleTeacherProfileDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/teachers/reorder` body — same shape as every other list type's. */
export class ReorderTeacherProfilesDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
