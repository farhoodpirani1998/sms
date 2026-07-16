import { IsObject, IsOptional, IsUUID } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateFaqDto` / `UpdateFaqDto` — CMS-D.6. Same shape every prior
 * CMS-D DTO pair established: `siteId` required on create and immutable
 * after (updates scope via `SiteIdQueryDto`'s `?siteId=`). `question`/
 * `answer` are only shape-checked (`@IsObject()`), matching every other
 * `LocalizedText` field in the module — both required on create, and
 * both `@IsOptional()` on update in the same "PATCH may send a subset of
 * fields" sense every other CMS-D `UpdateXDto` already uses (an omitted
 * field on a PATCH means "leave as is", not "clear it").
 */
export class CreateFaqDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  question: LocalizedText;

  @IsObject()
  answer: LocalizedText;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsObject()
  question?: LocalizedText;

  @IsOptional()
  @IsObject()
  answer?: LocalizedText;
}
