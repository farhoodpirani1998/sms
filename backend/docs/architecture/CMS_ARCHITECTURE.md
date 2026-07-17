# CMS Module — Architecture Design (Revised)

Target: `src/modules/cms/` inside the existing TuitionSchool NestJS backend.
One app, one Postgres DB, one deploy, one Auth/Audit/Users/Redis/Scheduler
stack — the CMS reuses the *existing* infrastructure rather than forking it.

**This revision finalizes the CMS as its own bounded context.** It is no
longer `school_id`-scoped. It is scoped by a new `Site` entity that belongs
to the CMS domain and has no dependency on `School`. This is the single
biggest change from the first draft — see §1 and §2 below.

---

## 1. Guiding decisions

| Concern | Decision |
|---|---|
| Schema | New Postgres schema `cms`, same database, same `DATABASE_URL`, same connection pool. |
| **Bounded context** | CMS is a **separate bounded context from the School domain**. No CMS entity has a foreign key, join, or import path to `School`. |
| **Tenancy / scoping** | CMS content is scoped by `site_id`, referencing a new `Site` entity — **not** `school_id`. `Site` is a pure content-partition concept, defined and owned entirely inside the CMS module. |
| **`Site` vs. auth tenant** | `Site` is **not** an authentication tenant. It carries no auth, users, roles, or billing semantics. A user's identity, role, and permissions come entirely from the existing Auth system, unrelated to which Site their CMS action targets. |
| **Multiplicity** | Only one `Site` row exists today (NHG). The schema, entities, and resolution logic are written generically so a second `Site` requires **inserting a row, not changing schema or code**. |
| Auth | Reuses `AuthModule` / `JwtAuthGuard` / `RolesGuard` exactly as implemented. No second login system, no Site-scoped auth. |
| Fine-grained access | Extends the existing `Permission` enum (`common/authorization/permissions.ts`) with `CMS_*` values instead of inventing a parallel authorization layer. Permissions are global to the user's role, not Site-scoped (consistent with `Site` not being an auth tenant). |
| Audit | Reuses `AuditService` exactly as implemented; extends `AuditAction` enum with `CMS_*` actions. CMS **revisions** are a separate, CMS-specific concept (content snapshots for rollback) — audit log is "who did what", revisions are "what did it look like". |
| Events | Reuses the global `EventEmitterModule`; adds CMS event constants to `common/events/domain-events.ts` (or a co-located `cms/core/events/cms-domain-events.ts` following the same shape). |
| Redis | Reuses the existing `ioredis`/BullMQ connection — for public-API response caching and (optionally) image-processing jobs. No second Redis client. |
| Scheduler | Reuses `@nestjs/schedule` the same way `modules/scheduler/*.cron.ts` already does. No second cron runner. |
| Media | New `MediaAsset` entity + storage-provider abstraction lives in `cms/core/media/`, scoped by `site_id`. New infrastructure (today `StudentDocument.fileUrl` is just a bare string with no upload pipeline) — written so it *could* be promoted to a shared module later without a rewrite. |
| Migrations | Plain TypeORM migrations in `src/database/migrations/`, same numbering convention as existing ones. First migration creates the schema, second creates `Site`. |

---

## 2. The `Site` entity

`Site` replaces `school_id` as the scoping key for every CMS entity. It lives
in `cms/core/site/` and is owned entirely by the CMS bounded context.

```ts
@Entity({ name: 'sites', schema: 'cms' })
export class Site {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() name: string;
  @Column({ unique: true }) domain: string;               // e.g. "nhg.example.com" — used to resolve the public API by Host header

  @Column({ name: 'default_locale' }) defaultLocale: string;      // e.g. "en"
  @Column({ name: 'supported_locales', type: 'jsonb' }) supportedLocales: string[]; // e.g. ["en", "fa"]

  @Column({ type: 'jsonb', nullable: true }) theme: Record<string, unknown> | null;      // colors, logo, fonts, etc.
  @Column({ name: 'social_links', type: 'jsonb', nullable: true }) socialLinks: Record<string, string> | null;
  @Column({ name: 'seo_defaults', type: 'jsonb', nullable: true }) seoDefaults: SeoMeta | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
```

Notes:
- `domain` is what the public API resolver uses to find the Site from the
  incoming `Host` header (see §3.9). It's unique, indexed, and is the only
  thing that needs a new row when a second Site is added.
- Fields are deliberately extensible (`theme`, `socialLinks`, `seoDefaults`
  are `jsonb`) so Site-level config can grow without new migrations.
- `Site` has **no** column, join, or import referencing `School`, `schoolId`,
  or anything in `modules/school/*`. This is the enforcement point for
  guiding decision "no CMS → School dependency."
- There is deliberately no `SiteUser` / `SiteMembership` table. Since `Site`
  is not an auth tenant, "who can edit this Site's content" is answered by
  the existing global `Permission` system (§4), not by a Site-scoped ACL.
  If per-Site access control is ever needed, that's an additive join table
  later — not a blocker today with a single Site.

---

## 3. Directory layout

```
src/modules/cms/
├── cms.module.ts                     # aggregates everything below, imported once in AppModule
├── common/
│   ├── entities/
│   │   ├── base-cms.entity.ts        # id, siteId, createdAt, updatedAt, createdById, updatedById
│   │   └── publishable.entity.ts     # status, publishedAt, scheduledAt (abstract base, not a table)
│   ├── enums/
│   │   ├── content-status.enum.ts    # DRAFT | IN_REVIEW | SCHEDULED | PUBLISHED | ARCHIVED
│   │   └── cms-entity-type.enum.ts   # one entry per content type, used by revisions/public-api
│   ├── interfaces/
│   │   └── localized-text.type.ts    # Record<string, string> keyed by locale
│   ├── services/
│   │   ├── base-content.service.ts   # generic CRUD + ordering + revision hooks + publish hooks
│   │   └── locale-resolver.service.ts
│   ├── decorators/
│   │   └── public-site-context.decorator.ts   # resolves Site from domain/Host header (public API)
│   └── dto/
│       ├── pagination-query.dto.ts
│       └── locale-query.dto.ts
│
├── core/
│   ├── site/                  # Site entity, admin CRUD (name/domain/locales/theme/social/seo), site-resolver service
│   ├── media/                 # MediaAsset entity (site-scoped), upload controller, StorageProvider abstraction
│   ├── publishing/            # status transitions + scheduled-publish cron (mirrors modules/scheduler)
│   ├── revisions/             # generic ContentRevision entity + service + controller
│   ├── ordering/              # OrderingService: reorder(ids[]) → transactional sortOrder rewrite
│   ├── seo/                   # SeoMeta value type + sitemap/robots helpers (no own table)
│   ├── i18n/                  # supported-locale config, fallback resolution
│   ├── events/                # CMS domain event classes + constants
│   └── public-api/            # PublicCacheInterceptor, cache-invalidation listener, Site resolver (by domain/Host)
│
└── content/
    ├── hero/
    ├── about/
    ├── pages/
    ├── news/
    ├── gallery/
    ├── features/
    ├── faq/
    ├── testimonials/
    ├── teachers/
    ├── campuses/
    ├── statistics/
    ├── cta/
    ├── navigation/
    └── site-settings/
```

Each folder under `content/` follows the same shape as existing feature
modules (`entities/`, `dto/`, `*.service.ts`, `*.module.ts`) plus **two
controllers**: an admin controller (guarded, CRUD, `site_id` supplied
explicitly or defaulted to the single Site) and a public controller (no
guard, resolved by domain, cached) — same "two controllers, one module"
pattern the repo already uses in `StudentDocumentsModule`. Public endpoints
live next to the content they serve rather than in one giant central
controller, matching how the rest of the codebase organizes by feature.

---

## 4. Core building blocks

### 4.1 Base entity

```ts
export abstract class BaseCmsEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'site_id' }) siteId: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder: number;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true }) publishedAt: Date | null;
  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true }) scheduledAt: Date | null;

  @Column({ name: 'created_by_id', nullable: true }) createdById: string | null;
  @Column({ name: 'updated_by_id', nullable: true }) updatedById: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
```

`createdById` / `updatedById` reference the existing `User` entity (from the
reused Auth/Users system) — that's the one and only cross-module reference
CMS entities have, and it points at Users, never at School.

A concrete type just adds its own fields and a `Site` relation:

```ts
@Entity({ name: 'news_articles', schema: 'cms' })
export class NewsArticle extends BaseCmsEntity {
  @ManyToOne(() => Site) @JoinColumn({ name: 'site_id' }) site: Site;

  @Column({ type: 'jsonb' }) title: Record<string, string>;       // i18n
  @Column({ type: 'jsonb' }) body: Record<string, string>;        // i18n
  @Column({ type: 'jsonb', nullable: true }) seo: SeoMeta | null; // embedded, not a join
  @Column({ name: 'cover_media_id', nullable: true }) coverMediaId: string | null;
}
```

### 4.2 i18n — jsonb columns, not a translation table

Unchanged from the original design. Translatable fields are `jsonb` columns
keyed by locale (`{"en": "...", "fa": "..."}`), resolved through
`LocaleResolverService`, which falls back to the **Site's** `defaultLocale`
(previously: the school's). `supportedLocales` now lives on `Site` (§2)
instead of being implied by the school record.

### 4.3 Publishing workflow

Unchanged in shape. `ContentStatus`: `DRAFT → IN_REVIEW → PUBLISHED`, with
`SCHEDULED` and `ARCHIVED` as side states. `BaseContentService` exposes
`publish()`, `unpublish()`, `schedule(date)`, all of which:
1. write a `ContentRevision` snapshot,
2. flip `status`/`publishedAt`,
3. emit a `cms.<type>.published` domain event,
4. call `AuditService.record()` with `AuditAction.CMS_CONTENT_PUBLISHED`.

Scheduled-publish cron (`core/publishing/scheduled-publish.cron.ts`) is
unchanged — it's Site-agnostic; it just scans for `SCHEDULED` rows whose
`scheduledAt <= now()` across all Sites.

### 4.4 Revisions (generic, polymorphic)

```ts
@Entity({ name: 'content_revisions', schema: 'cms' })
export class ContentRevision {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'site_id' }) siteId: string;
  @Column({ name: 'entity_type', type: 'enum', enum: CmsEntityType }) entityType: CmsEntityType;
  @Column({ name: 'entity_id' }) entityId: string;
  @Column({ name: 'revision_number', type: 'int' }) revisionNumber: number;
  @Column({ type: 'jsonb' }) snapshot: Record<string, unknown>;
  @Column({ name: 'status_at_revision', type: 'enum', enum: ContentStatus }) statusAtRevision: ContentStatus;
  @Column({ name: 'author_id', nullable: true }) authorId: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
```

Only the tenancy column changed (`school_id` → `site_id`). Everything else —
`RevisionService.snapshot(...)`, the generic
`GET /cms/:entityType/:id/revisions` and
`POST /cms/:entityType/:id/revisions/:revisionId/restore` endpoints — is
unchanged.

### 4.5 Ordering

Unchanged: `sort_order int` column + `OrderingService.reorder(entityType,
orderedIds[])`, transactional, per content type. Ordering is naturally
Site-scoped since it only ever operates on ids the caller already resolved
within one Site.

### 4.6 SEO

Unchanged: embedded `jsonb` `seo: SeoMeta | null` on Pages/News/Campuses/
Teachers. `Site.seoDefaults` (§2) provides the fallback when a specific
entity doesn't override title/description/og-image — this replaces the
implicit "school defaults" that would have existed under the old model.

```ts
export interface SeoMeta {
  title?: Record<string, string>;
  description?: Record<string, string>;
  ogImageId?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
}
```

`core/seo/` also owns a small `SitemapService`/`RobotsService` that walks
published Pages/News **per Site** (previously: per school) to generate
`sitemap.xml` and `robots.txt` for the public API.

### 4.7 Media

`MediaAsset` (schema `cms`): `id, siteId, originalFilename, mimeType,
sizeBytes, storageKey, url, width, height, altText, uploadedById, createdAt`.
Only the tenancy column changed from the original draft.

`StorageProvider` interface with two implementations selected by
`MEDIA_STORAGE_DRIVER=local|s3` (new env var, validated in
`env.validation.ts` the same way `REDIS_HOST` etc. already are):
- `LocalDiskStorageProvider` — writes under a configurable local path, fine
  for dev/single-box deploys.
- `S3StorageProvider` — for anything behind a CDN in production. Storage
  keys should be namespaced by `siteId` (e.g. `sites/{siteId}/...`) so a
  second Site's media never collides with the first's, without needing a
  second bucket.

Upload endpoint uses `@nestjs/platform-express`'s `FileInterceptor`
(`multer`, already a transitive dep). Optional thumbnailing/resizing runs as
a BullMQ job on the **existing** `BullModule` connection (new queue
`media-processing`) — same shape as `NotificationsModule`'s existing queue
usage.

**New dependency needed:** `sharp` (image resizing) if thumbnailing is
wanted at launch; can be deferred without blocking anything else.

### 4.8 Domain events

Unchanged:

```ts
export const CMS_DOMAIN_EVENTS = {
  CONTENT_PUBLISHED: 'cms.content.published',
  CONTENT_UNPUBLISHED: 'cms.content.unpublished',
  CONTENT_UPDATED: 'cms.content.updated',
  MEDIA_UPLOADED: 'cms.media.uploaded',
} as const;
```

Event payloads carry `siteId` instead of `schoolId`; the sole listener at
launch (public-API cache invalidator) uses it to scope the Redis keys it
clears.

### 4.9 Public API

`core/public-api/` provides shared plumbing used by every content module's
public controller:
- **`PublicSiteContextGuard`** (renamed from `PublicSchoolContextGuard`) —
  resolves the `Site` from the incoming `Host` header (matched against
  `Site.domain`), **not** from a school slug in the URL. A slug-based
  fallback path (`/api/v1/public/site/:siteSlug/...`) can still exist for
  local/dev/testing convenience, but production resolution is host-based —
  this is what lets the same deployed app serve multiple Sites purely by
  DNS/domain, with zero code or schema changes when Site #2 is added.
- **`PublicCacheInterceptor`** — reads/writes Redis with key
  `cms:public:{siteId}:{locale}:{route}`, short TTL (e.g. 60s) as a floor,
  with the invalidation listener from §4.8 deleting matching keys the moment
  something publishes.
- Every content module mounts its own public routes, e.g.
  `GET /api/v1/public/news`, `GET /api/v1/public/pages/:slug` — Site is
  implicit from the resolved Host, so it doesn't need to appear in the path
  at all in the domain-based flow. Always filtered to `status = PUBLISHED`
  (and, for scheduled rows, `publishedAt <= now()`).

### 4.10 `SiteSettings` vs. `Site` — kept separate

`SiteSettings` (in `content/site-settings/`) is a normal `content/` module,
not a merged part of `Site`. It extends `BaseCmsEntity` like every other
content type (status, revisions, publish workflow) and is enforced as a
singleton per `site_id` (unique index on `site_id`, service-layer
get-or-create). Sketch:

```ts
@Entity({ name: 'site_settings', schema: 'cms' })
export class SiteSettings extends BaseCmsEntity {
  @ManyToOne(() => Site) @JoinColumn({ name: 'site_id' }) site: Site;

  @Column({ name: 'contact_email', nullable: true }) contactEmail: string | null;
  @Column({ name: 'contact_phone', nullable: true }) contactPhone: string | null;
  @Column({ type: 'jsonb', nullable: true }) address: Record<string, string> | null;
  @Column({ name: 'business_hours', type: 'jsonb', nullable: true }) businessHours: Record<string, unknown> | null;
  @Column({ name: 'footer_text', type: 'jsonb', nullable: true }) footerText: Record<string, string> | null; // i18n
  @Column({ name: 'announcement_banner', type: 'jsonb', nullable: true }) announcementBanner: Record<string, unknown> | null;
}
```

Rationale: `Site` (§2) is technical/routing config, read on every public
request, cached aggressively, admin-only (`CMS_SITE_MANAGE`), and has no
draft/publish lifecycle. `SiteSettings` is editorial content — drafted,
revised, published, and audited the same way as News or Pages, gated by the
normal `CMS_CONTENT_EDIT`/`CMS_CONTENT_PUBLISH` permissions. Keeping them
separate avoids coupling their very different change-frequency, caching, and
permission profiles, and keeps `Site` from becoming a catch-all as
site-wide editorial fields grow over time.

---

## 5. Auth & permissions

No new role table, no Site-scoped auth, no change from the original design.
Extends the existing static maps:

```ts
// common/authorization/roles.enum.ts — no changes needed, reuse existing roles
// common/authorization/permissions.ts — additive:
export enum Permission {
  // ...existing...
  CMS_CONTENT_EDIT = 'cms:content:edit',
  CMS_CONTENT_PUBLISH = 'cms:content:publish',
  CMS_MEDIA_MANAGE = 'cms:media:manage',
  CMS_SITE_MANAGE = 'cms:site:manage',   // new: create/edit Site config (domain, theme, locales, seo defaults)
}
```

Suggested mapping: `school_admin` gets all four; `staff` gets
`CMS_CONTENT_EDIT` and `CMS_MEDIA_MANAGE` but not `CMS_CONTENT_PUBLISH` or
`CMS_SITE_MANAGE` (drafts need admin sign-off; Site-level config is
admin-only). `teacher`/`parent` get nothing here, same as today. Because
`Site` is not an auth tenant, these permissions are global to the user's
role — they are not evaluated "per Site," consistent with §1/§2.

---

## 6. Migrations

```
src/database/migrations/
  <ts>-CreateCmsSchema.ts       # CREATE SCHEMA IF NOT EXISTS cms;
  <ts>-CmsSite.ts               # creates `cms.sites`, seeds the single NHG row
  <ts>-CmsMedia.ts
  <ts>-CmsRevisions.ts
  <ts>-CmsSiteSettingsNavigation.ts
  <ts>-CmsSimpleContent.ts      # hero/about/cta/statistics/features/faq
  <ts>-CmsPages.ts
  <ts>-CmsNews.ts
  <ts>-CmsGalleryTestimonialsTeachersCampuses.ts
```

`Site` migrates before anything else that references `site_id`, and its
migration seeds exactly one row (NHG) via `domain` = the production host.
Every content-table migration declares `site_id uuid not null references
cms.sites(id)` — a real FK, unlike the old `school_id` columns which pointed
outside the `cms` schema into a different bounded context.

Every entity declares `schema: 'cms'` in its `@Entity()` decorator; since
`app.module.ts` already runs with `autoLoadEntities: true`, nothing else
changes in `TypeOrmModule.forRoot()`. `synchronize: false` stays untouched.

---

## 7. Wiring into the app

```ts
// app.module.ts — one line added to the existing imports array
import { CmsModule } from './modules/cms/cms.module';
// ...
imports: [
  // ...all existing modules unchanged...
  CmsModule,
],
```

`CmsModule` aggregates `core/*` and `content/*` sub-modules — nothing else
in the existing app needs to change. `AuditModule` and the global
`EventEmitterModule` are already global/exported, so CMS services inject
`AuditService`/`EventEmitter2` directly. Critically: `CmsModule` does **not**
import `SchoolModule`, and no CMS provider injects a School repository or
service — enforced by code review / import-boundary lint rule
(e.g. a `no-restricted-imports` ESLint rule blocking `modules/school/*`
imports from `modules/cms/*`).

---

## 8. Suggested phasing

1. **CMS-A — Foundation**: schema migration, `Site` entity + module + seed
   row, `BaseCmsEntity`, `ContentStatus`, `Permission` additions.
2. **CMS-B — Media**: `MediaAsset`, storage-provider abstraction, upload
   endpoint (thumbnailing can slip to a later phase).
3. **CMS-C — Publishing + Revisions + Events**: cross-cutting services every
   content type depends on, proven against one throwaway/simple entity
   before building 14 real ones on top.
4. **CMS-D — Simple content**: Hero, About, CTA, Statistics, Features, FAQ.
5. **CMS-E — Site Settings + Navigation**: Site-level config surface + menu
   tree (self-referencing `parentId` + `sortOrder`).
6. **CMS-F — Pages**: the most general-purpose type; exercises SEO + i18n +
   revisions + publishing together.
7. **CMS-G — News**: same shape as Pages plus a public listing/pagination
   endpoint.
8. **CMS-H — Gallery, Testimonials, Teachers, Campuses**.
9. **CMS-I — Public API + Redis caching**: wire `PublicSiteContextGuard`,
   the shared cache interceptor, and cache-invalidation listener across
   every content module built so far.

Each phase is independently mergeable and testable, same granularity as the
existing migration sequence.

---

## 9. Resolved from the previous draft

These were open questions in v1; the final decisions close them:

1. ~~School vs. multi-tenant scoping~~ → resolved: **`Site`**, not `School`,
   is the scoping key. `Site` is a content partition, not an auth tenant.
2. ~~Does "single school today" special-case the schema?~~ → resolved: no —
   one `Site` row exists today, but nothing in the schema, entities, or
   resolvers assumes a single Site. A second Site is a data insert.
3. ~~Cross-module coupling to School~~ → resolved: **zero** dependency from
   any CMS entity/service to `School`, enforced by an import-boundary rule.

Still open, unchanged from v1:

1. **i18n scope** — jsonb-per-locale assumes a small, fixed set of Site
   locales (e.g. `fa` + `en`), now living on `Site.supportedLocales`. If
   locales need to be added/removed per Site at runtime, that's still
   compatible but worth confirming.
2. **Media storage target** — local disk is fine for a single-box deploy;
   confirm if S3 (or another object store) is the actual production target.
