# Deployment / Production Readiness

Covers what Phase 4B added: observability, health checks, environment
validation, and Docker packaging. For prior hardening (auth, tenant
isolation, reliability, performance), see
[`../architecture/ARCHITECTURE_CHANGES.md`](../architecture/ARCHITECTURE_CHANGES.md)
and [`../security/security-roadmap.md`](../security/security-roadmap.md).

## Environment variables

See `.env.example` for the full list with inline comments. Validated at
boot by `src/config/env.validation.ts` (wired via `ConfigModule.forRoot`'s
`validate` option in `app.module.ts`) — an invalid or missing required
variable throws before any module (DB pool, Redis, HTTP server) starts
initializing.

Required in **every** environment:
- `DATABASE_URL`
- `JWT_SECRET`

Required only when `NODE_ENV=production` (the app fails fast at boot if
missing — this does not affect `npm run start:dev`):
- `CORS_ORIGINS` — comma-separated allow-list (already enforced separately
  in `main.ts` too; the env validator just catches it earlier).
- `REDIS_HOST` — no silent fallback to `localhost` in production.
- `REDIS_PASSWORD` — Redis has no auth by default; this is required so
  BullMQ and the readiness probe's Redis check always connect
  authenticated, and so `docker-compose.yml`'s `redis` service always
  boots with `--requirepass` rather than being open to anyone who can
  reach the port.
- `JWT_SECRET` must additionally be **at least 32 characters**.

Optional, with sane defaults: `REDIS_PORT` (6379), `PORT` (3000),
`LOG_LEVEL` (`info` in production, `debug` otherwise). `REDIS_PASSWORD` is
optional outside production (local dev Redis can run unauthenticated).

## Structured logging & request correlation

- All logs are structured JSON (via `pino`), emitted through
  `src/common/logging/app-logger.service.ts`, which is registered as
  Nest's app-wide logger in `main.ts`. Every existing `new Logger(name)`
  call site is unchanged — Nest transparently routes them through this
  logger once it's registered.
- Every inbound HTTP request gets a `requestId` (reused from an incoming
  `X-Request-Id` header if present and well-formed, otherwise generated).
  It's returned on the response as `X-Request-Id` and included in:
  - every log line emitted while handling that request (via
    `AsyncLocalStorage`, see `src/common/logging/request-context.ts`),
  - the JSON body of any error response (`AllExceptionsFilter`).
- Once a request is authenticated, `userId` and `schoolId` are added to
  the same context (`UserContextInterceptor`) and appear in subsequent log
  lines for that request — no per-service code changes required.
- One access-log line per completed request (method, path, status,
  duration) is emitted by `HttpLoggerMiddleware`.
- In development, logs are pretty-printed via `pino-pretty` (a
  devDependency — never present in the production image). In production
  they're plain JSON, suitable for ingestion by any log aggregator
  (CloudWatch, Datadog, Loki, ELK, etc.) that expects one JSON object per
  line.

## Health checks

Provided by `src/modules/health` (`@nestjs/terminus`), all public (no auth
required — the same way any other infra health endpoint works) and
exempt from the global rate limiter (`@SkipThrottle()`):

| Endpoint | Checks | Use for |
|---|---|---|
| `GET /api/v1/health/live` | process responsiveness only | Kubernetes liveness probe |
| `GET /api/v1/health/ready` | PostgreSQL + Redis reachability | Kubernetes readiness probe / LB health check |
| `GET /api/v1/health` | PostgreSQL + Redis reachability | general-purpose uptime monitor |

`/live` intentionally checks nothing external, so a transient DB/Redis
blip doesn't cause an orchestrator to kill and restart an otherwise-healthy
instance — that's what `/ready` is for.

## Docker

- `Dockerfile` — multi-stage build (`builder` → compiles TypeScript,
  `deps` → production-only `node_modules`, `runtime` → minimal Alpine
  image running as the non-root `node` user). Includes a `HEALTHCHECK`
  hitting `/api/v1/health/live`.
- `docker-compose.yml` — reference stack (app + Postgres + Redis) for
  self-hosted / single-VM deployments. If deploying to Kubernetes or a
  managed platform, use it as a reference for required env vars and
  healthcheck wiring rather than running it directly.
- `.dockerignore` — excludes `node_modules`, `dist`, tests, docs, and any
  `.env*` file (secrets are passed at run time, never baked into a layer).

```bash
cp .env.example .env   # fill in real values — see comments in the file
docker compose up -d --build
docker compose exec app npm run migration:run   # once, before serving traffic
```

Migrations are **never** run automatically on container start
(`migrationsRun: false` in `app.module.ts`, unchanged from Phase 1) — run
them explicitly as a one-off step before rolling out a new image, the same
way `npm run migration:run` works outside Docker.

## CMS module — production readiness

Reviewed ahead of the CMS module going live; no architecture or content
behavior changed by this review.

**Media storage** (`src/modules/cms/core/media`): `MEDIA_STORAGE_DRIVER`
picks `local` (default) or `s3` at boot via `storageProviderFactory` — see
`.env.example` for the full var list. Two things to confirm before
running the `local` driver in production:
- `MEDIA_LOCAL_PATH` must point at a persistent, writable volume — a
  container's ephemeral filesystem loses every upload on redeploy.
- On more than one app instance (any horizontally-scaled deployment),
  `MEDIA_LOCAL_PATH` must be a *shared* volume, or uploads written by one
  instance 404 when read back through another.
- Nothing in the app currently serves the `/media/{key}` URL
  `LocalDiskStorageProvider` returns — no static-assets mount exists in
  `main.ts`. Production must add one (or a reverse-proxy rule pointing at
  the same volume) for local-stored media to be reachable at all; this is
  unchanged from the provider's own doc comment, which already calls this
  an ops/deployment concern outside the CMS module's code.

For the `s3` driver: `S3StorageProvider` talks to real AWS S3 today — the
URL it returns is hardcoded to
`https://{bucket}.s3.{region}.amazonaws.com/{key}`, so it only produces a
working public URL against actual AWS. Recent AWS SDK v3 releases resolve
a custom endpoint from the standard `AWS_ENDPOINT_URL_S3` (or
`AWS_ENDPOINT_URL`) environment variable with no app code changes, so an
S3-compatible backend (MinIO, Cloudflare R2, DigitalOcean Spaces, etc.)
can likely be pointed at via that env var alone for the actual
upload/read calls — but the *returned* `url` field would still be wrong
(it always renders an `amazonaws.com` host regardless of the real
endpoint). Making that field correct for a non-AWS endpoint needs a small
code change to `S3StorageProvider` (an injectable base URL / endpoint
override) — intentionally not made here, since this pass is env/docs
only. Track it before an S3-compatible (non-AWS) provider goes live.

**Public cache** (`src/modules/cms/core/public-api`): `PUBLIC_CACHE_REDIS`
is its own `ioredis` connection (separate from the BullMQ connection),
created by `createPublicCacheRedisClient()`. It reads `REDIS_HOST`/
`REDIS_PORT`/`REDIS_PASSWORD` straight from `process.env` — the same vars
already required above, not a separate config surface — so no new env
var is needed to run it in production; it authenticates automatically
wherever `REDIS_PASSWORD` is already set. A Redis read/write failure is
caught and treated as a cache miss/no-op (`PublicCacheInterceptor`'s
`safeGet`/`safeSet`), so a Redis outage degrades public CMS reads to
uncached rather than failing them.

TTL is a 60-second constant (`PUBLIC_CACHE_TTL_SECONDS` in
`public-cache.interceptor.ts`), not env-configurable. That's intentional
per its own doc comment: it's a backstop for the gap between a write and
`CacheInvalidationListener` clearing the affected Site's keys, not the
primary invalidation path, so it's meant to stay short and fixed rather
than become a tunable. Left unchanged.

## Production-safe defaults reviewed in this phase

- **`trust proxy`** is enabled in production (`main.ts`) so Express (and
  therefore `ThrottlerGuard`'s per-IP limiting, and `req.ip` in logs) sees
  the real client IP through a reverse proxy/load balancer instead of the
  proxy's own address.
- **Graceful shutdown**: `app.enableShutdownHooks()` lets Nest close the
  Postgres pool, Redis connections, and in-flight BullMQ work cleanly on
  `SIGTERM`/`SIGINT` (container stop, rolling deploy) instead of the
  process being killed mid-request.
- **CORS_ORIGINS fail-fast** (existing Phase-1/2 behavior in `main.ts`) is
  preserved unchanged; environment validation now also catches a missing
  value earlier, before the HTTP layer even starts.
