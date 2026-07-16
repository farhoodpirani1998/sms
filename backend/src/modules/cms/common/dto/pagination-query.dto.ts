import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../../../../common/utils/pagination';

/**
 * `PaginationQueryDto` — CMS-C.3. Shared `?page=&limit=` query shape for
 * every `content/*` admin list endpoint from CMS-D onward, so each
 * content module's controller doesn't redeclare its own paging DTO.
 *
 * Deliberately reuses `common/utils/pagination.ts`'s `DEFAULT_PAGE_LIMIT`
 * (50) / `MAX_PAGE_LIMIT` (200) — the same ceiling already applied to
 * students/installments/payments — rather than inventing CMS-specific
 * numbers, since a single admin list endpoint is exactly the case that
 * helper was sized for (unlike `QuerySearchDto`'s smaller per-category
 * cap, which fans out across six queries per request).
 *
 * `BaseContentService.findAll()` (this sub-phase) is what actually
 * normalizes `page`/`limit` via `normalizePagination()` — this DTO only
 * validates the raw query params before they reach it.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit?: number = DEFAULT_PAGE_LIMIT;
}
