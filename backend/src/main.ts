import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { resolve } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logging/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Structured (JSON in production, pretty in dev) logger — see
    // app-logger.service.ts. bufferLogs holds Nest's own bootstrap log
    // lines until this logger is ready, so nothing gets lost/printed via
    // the old console format before the switch takes effect.
    logger: new AppLogger(),
    bufferLogs: true,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // The app sits behind a reverse proxy / load balancer in production
  // (see docker-compose.yml, docs/DEPLOYMENT.md). Without this, Express
  // (and therefore ThrottlerGuard's per-IP limiting, and req.ip in logs)
  // sees the proxy's IP for every request instead of the real client's.
  if (isProduction) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Let Nest catch SIGTERM/SIGINT (sent by Docker/Kubernetes on
  // stop/rolling-deploy) and run each module's OnModuleDestroy hook —
  // closes the Postgres pool, Redis connections, and in-flight BullMQ
  // jobs cleanly instead of the process being killed mid-request.
  app.enableShutdownHooks();

  app.use(helmet());

  // CMS media (src/modules/cms/core/media): when MEDIA_STORAGE_DRIVER is
  // "local" (the default — see .env.example), LocalDiskStorageProvider
  // writes files to disk and returns a `/media/{key}` URL, but until now
  // nothing actually served that path — uploads succeeded but were
  // unreachable over HTTP. This was flagged as an open gap in
  // docs/deployment/DEPLOYMENT.md's "CMS module — production readiness"
  // section; closing it here rather than leaving it purely a docs note.
  // Mounted outside `api/v1` (matches the bare `/media/...` URL the
  // provider returns, same base path used for both), with directory
  // listing and dotfile access both denied. When MEDIA_STORAGE_DRIVER=s3,
  // this route simply serves nothing (no local files exist to find) and
  // is harmless to leave mounted.
  const mediaLocalPath = resolve(process.env.MEDIA_LOCAL_PATH || './storage/media');
  app.useStaticAssets(mediaLocalPath, {
    prefix: '/media/',
    index: false,
    dotfiles: 'deny',
  });

  const configuredOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);

  if (isProduction && (!configuredOrigins || configuredOrigins.length === 0)) {
    // Previously this fell through to `origin: true` (reflects every
    // request's Origin header, i.e. allow-all) whenever CORS_ORIGINS
    // wasn't set — safe for local dev, unacceptable in production where
    // it's usually a missing/forgotten env var, not an intentional
    // choice. Fail loudly at boot instead of silently running wide open.
    throw new Error(
      'CORS_ORIGINS must be set to a comma-separated list of allowed origins when NODE_ENV=production',
    );
  }

  app.enableCors({
    // Comma-separated list of allowed origins, e.g. "https://app.example.com,https://admin.example.com"
    // Development only: falls back to reflecting any origin (`true`) so
    // local frontends on arbitrary ports keep working without extra setup.
    origin: configuredOrigins ?? true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not declared in the DTO
      forbidNonWhitelisted: true,
      transform: true, // enables the @Type() coercion used in DTOs
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
