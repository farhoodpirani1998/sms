import { ArrayNotEmpty, IsArray, IsDateString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other content type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/testimonials` — site scope plus the shared paging shape. */
export class TestimonialListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /public/testimonials` — public read scope, locale-resolved.
 * `siteId` no longer travels here as of CMS-I.5 — `PublicSiteContextGuard`
 * resolves the Site from the `Host` header (or dev slug fallback) instead. */
export class PublicTestimonialQueryDto extends LocaleQueryDto {}

/** `POST /cms/testimonials/:id/schedule` body. */
export class ScheduleTestimonialDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/** `POST /cms/testimonials/reorder` body — same shape as every other list type's. */
export class ReorderTestimonialsDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
