import {
  IsString,
  MaxLength,
  Matches,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsObject,
} from 'class-validator';

// Every field optional -- same hand-written "partial DTO" convention as
// UpdateSchoolSettingsDto (no @nestjs/mapped-types dependency in this
// codebase). SiteService.update() merges whichever fields the caller
// provides onto the existing row; omitted fields are left unchanged.
export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9.-]+$/i, {
    message: 'domain must be a bare hostname (e.g. nhg.example.com)',
  })
  @MaxLength(255)
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultLocale?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  supportedLocales?: string[];

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string> | null;

  @IsOptional()
  @IsObject()
  seoDefaults?: Record<string, unknown> | null;
}
