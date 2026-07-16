import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum MediaStorageDriver {
  Local = 'local',
  S3 = 's3',
}

/**
 * Shape of the environment variables the app actually depends on.
 * Validated once at startup (wired via ConfigModule.forRoot({ validate })
 * in app.module.ts) so a missing/malformed value fails loudly at boot —
 * before Postgres/Redis connections are even attempted — instead of
 * surfacing later as a confusing runtime error (or, worse, a silent
 * insecure default like an open CORS policy).
 *
 * Fields required in every environment (DATABASE_URL, JWT_SECRET) use
 * plain decorators. Fields only required in production (CORS_ORIGINS,
 * REDIS_HOST, a minimum JWT_SECRET length) are checked separately in
 * validateEnv() below, since they must NOT block `npm run start:dev`.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV?: Environment;

  @IsString()
  @MinLength(1, { message: 'DATABASE_URL is required' })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(1, { message: 'JWT_SECRET is required' })
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  // CMS-B.2/B.3: selects StorageProvider implementation. Optional and
  // defaults to 'local' (see media.module.ts) so existing deployments
  // that predate the CMS media feature don't need a new env var to keep
  // booting.
  @IsOptional()
  @IsEnum(MediaStorageDriver)
  MEDIA_STORAGE_DRIVER?: MediaStorageDriver;

  // Only consulted when MEDIA_STORAGE_DRIVER=local (or unset). Defaults
  // to './storage/media' in LocalDiskStorageProvider itself if omitted.
  @IsOptional()
  @IsString()
  MEDIA_LOCAL_PATH?: string;

  // CMS-B.3: only required when MEDIA_STORAGE_DRIVER=s3 — that
  // conditional requirement is enforced in storage-provider.factory.ts
  // (which throws a clear error at provider-construction time), not here
  // with class-validator decorators, since these vars must NOT block
  // boot for the (still-default) local driver.
  @IsOptional()
  @IsString()
  MEDIA_S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  MEDIA_S3_REGION?: string;

  @IsOptional()
  @IsString()
  MEDIA_S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  MEDIA_S3_SECRET_ACCESS_KEY?: string;
}

// Minimum JWT_SECRET length enforced only in production — long enough to
// resist brute-force guessing of the HMAC key, without forcing a specific
// value on developers running locally with the .env.example placeholder.
const MIN_PRODUCTION_JWT_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .filter(Boolean)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  if (validated.NODE_ENV === Environment.Production) {
    const missing: string[] = [];
    if (!validated.CORS_ORIGINS) missing.push('CORS_ORIGINS');
    if (!validated.REDIS_HOST) missing.push('REDIS_HOST');
    // Redis has no auth by default. Requiring a password in production
    // means BullModule.forRoot / RedisHealthIndicator (app.module.ts,
    // health/redis-health.indicator.ts) always connect authenticated, and
    // docker-compose.yml's redis service always boots with --requirepass.
    if (!validated.REDIS_PASSWORD) missing.push('REDIS_PASSWORD');

    if (missing.length > 0) {
      throw new Error(
        `Missing required production environment variable(s): ${missing.join(', ')}`,
      );
    }

    if (validated.JWT_SECRET.length < MIN_PRODUCTION_JWT_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_PRODUCTION_JWT_SECRET_LENGTH} characters long in production`,
      );
    }
  }

  return validated;
}
