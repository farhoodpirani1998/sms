import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateTestimonialDto` / `UpdateTestimonialDto` — CMS-H.2. Same shape
 * every prior content type's DTO pair established: `siteId` required on
 * create and immutable after (updates scope via `SiteIdQueryDto`'s
 * `?siteId=`). `quote`/`authorRole` are only shape-checked
 * (`@IsObject()`), same as every other `LocalizedText` field.
 * `authorName` is a plain required string (not localized, see the
 * entity's doc comment). `rating`, if supplied, is range-checked here
 * (1–5) ahead of the DB's own `CHECK` constraint, same "format here,
 * DB is the final source of truth" split every other constrained field
 * uses.
 */
export class CreateTestimonialDto {
  @IsUUID()
  siteId: string;

  @IsObject()
  quote: LocalizedText;

  @IsString()
  @MaxLength(255)
  authorName: string;

  @IsOptional()
  @IsObject()
  authorRole?: LocalizedText;

  @IsOptional()
  @IsUUID()
  avatarMediaId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class UpdateTestimonialDto {
  @IsOptional()
  @IsObject()
  quote?: LocalizedText;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @IsOptional()
  @IsObject()
  authorRole?: LocalizedText;

  @IsOptional()
  @IsUUID()
  avatarMediaId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
