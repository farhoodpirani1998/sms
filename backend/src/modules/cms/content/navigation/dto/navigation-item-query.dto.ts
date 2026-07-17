import { ArrayNotEmpty, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

/** `?siteId=` scoping for single-record admin actions — same pattern as every other content type's. */
export class SiteIdQueryDto {
  @IsUUID()
  siteId: string;
}

/**
 * `GET /cms/navigation` — site scope plus the shared paging shape.
 * Unlike other list types this returns the flat row set (tree assembly
 * is `findTree()`'s job, used by the public controller) — the admin
 * screen needs the flat list to edit individual rows.
 */
export class NavigationItemListQueryDto extends PaginationQueryDto {
  @IsUUID()
  siteId: string;
}

/** `GET /public/navigation` — public tree read, locale-resolved. */
export class PublicNavigationQueryDto extends LocaleQueryDto {}

/** `POST /cms/navigation/:id/schedule` body. */
export class ScheduleNavigationItemDto {
  @IsUUID()
  siteId: string;

  @IsDateString()
  scheduledAt: string;
}

/**
 * `POST /cms/navigation/reorder` body — reorders one sibling group at a
 * time. `parentId` omitted/`null` reorders the top-level items; a
 * provided `parentId` reorders that item's direct children only. This
 * mirrors `ReorderStatisticDto` but adds the parent scope every other
 * list type doesn't need, since a Site's navigation items aren't one
 * flat ordered list.
 */
export class ReorderNavigationItemsDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}

/**
 * `POST /cms/navigation/:id/reparent` body — moves an item under a new
 * parent (or to top level when `parentId` is omitted). Kept separate
 * from `UpdateNavigationItemDto`, same reasoning as that DTO's doc
 * comment: changing an item's position in the tree is a distinct
 * operation from editing its label/url.
 */
export class ReparentNavigationItemDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
