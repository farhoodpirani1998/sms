import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/**
 * `SiteIdQueryDto` — CMS-C.5. `?siteId=` scoping for every single-record
 * admin action (`findOne`/`update`/`remove`/`publish`/`unpublish`/
 * `schedule`/`restore`) that only has an `:id` route param to work with —
 * `BaseContentService`'s methods all require `siteId` explicitly rather
 * than trusting a bare `id` (see that class's doc comment), so the
 * controller needs it from somewhere; a create's `siteId` travels in the
 * request body (`CreateProofBlockDto`) since there's a body to put it
 * in, but these actions either have no body (`GET`/`DELETE`) or a body
 * that shouldn't also have to carry `siteId` on every call, so it's a
 * query param instead, validated the same `@IsUUID()` way every other id
 * in this codebase is (see `QueryTimetableDto` for the existing
 * precedent of an `@IsUUID()` query-param DTO).
 */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /cms/proof-blocks` — site scope plus the shared paging shape. */
export class ProofBlockListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `POST /cms/proof-blocks/:id/schedule` body. */
export class ScheduleProofBlockDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/**
 * `POST /cms/proof-blocks/reorder` body — no `:id` route param (it
 * reorders many rows at once), so `siteId` lives in the body alongside
 * `orderedIds` rather than as a query param.
 */
export class ReorderProofBlocksDto {
  @IsUUID()
  siteId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
