import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LocalizedText } from '../../../common/interfaces/localized-text.type';

/**
 * `CreateTeacherProfileDto` / `UpdateTeacherProfileDto` — CMS-H.3. Same
 * shape every prior content type's DTO pair established: `siteId`
 * required on create and immutable after (updates scope via
 * `SiteIdQueryDto`'s `?siteId=`). `name` is a plain required string
 * (not localized, see the entity's doc comment). `role`/`bio` are only
 * shape-checked (`@IsObject()`), same as every other `LocalizedText`
 * field. No `staffId`/`teacherId` field of any kind — see the entity's
 * bounded-context note; this DTO has nothing to validate against the
 * School domain because it has no relation to it.
 */
export class CreateTeacherProfileDto {
  @IsUUID()
  siteId: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsObject()
  role?: LocalizedText;

  @IsOptional()
  @IsObject()
  bio?: LocalizedText;

  @IsOptional()
  @IsUUID()
  photoMediaId?: string;
}

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsObject()
  role?: LocalizedText;

  @IsOptional()
  @IsObject()
  bio?: LocalizedText;

  @IsOptional()
  @IsUUID()
  photoMediaId?: string;
}
