import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateNavigationItemDto` / `UpdateNavigationItemDto` — CMS-E.2. Same
 * shape every prior content type's DTO pair established: `siteId`
 * required on create and immutable after (updates scope via
 * `SiteIdQueryDto`'s `?siteId=`). `parentId` is optional/nullable — a
 * top-level menu item has no parent — and, like `siteId`, is not
 * accepted on update through this DTO; re-parenting (moving an item to
 * a different parent) is a distinct operation from editing its own
 * label/url, same reasoning as `reorder()` being separate from
 * `update()` for every other list type.
 */
export class CreateNavigationItemDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsObject()
  label: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  url?: string;
}

export class UpdateNavigationItemDto {
  @IsOptional()
  @IsObject()
  label?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  url?: string;
}
