import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsObject,
} from 'class-validator';

// Only `name`/`domain`/`defaultLocale`/`supportedLocales` are required to
// create a Site — theme/socialLinks/seoDefaults are jsonb-extensible
// config a caller can fill in afterwards via update(). Domain uniqueness
// itself is enforced at the DB (unique index from CmsSite migration);
// this DTO only validates shape.
export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  // Bare hostname, no protocol/path — this is matched directly against
  // the incoming Host header by the public API's Site resolver later.
  @IsString()
  @Matches(/^[a-z0-9.-]+$/i, {
    message: 'domain must be a bare hostname (e.g. nhg.example.com)',
  })
  @MaxLength(255)
  domain: string;

  @IsString()
  @MaxLength(10)
  defaultLocale: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  supportedLocales: string[];

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @IsOptional()
  @IsObject()
  seoDefaults?: Record<string, unknown>;
}
