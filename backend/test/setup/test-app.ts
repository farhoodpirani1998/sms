import { Test } from '@nestjs/testing';
import { CanActivate, INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const migrationDataSource = require('../../src/database/data-source').default as DataSource;

let migrationsRun = false;

/**
 * Runs the real migration set (src/database/migrations/*.ts) against
 * TEST_DATABASE_URL exactly once per test process — every test file that
 * calls createTestApp() shares the same already-migrated schema instead of
 * re-running migrations per file.
 */
export async function ensureMigrations(): Promise<void> {
  if (migrationsRun) return;
  if (!migrationDataSource.isInitialized) {
    await migrationDataSource.initialize();
  }
  await migrationDataSource.runMigrations();
  migrationsRun = true;
}

const alwaysAllow: CanActivate = { canActivate: () => true };

/**
 * Boots the full application (real AppModule, real guards, real Postgres)
 * the same way main.ts does, so these tests exercise the actual
 * JwtAuthGuard → RolesGuard → PermissionsGuard → controller → service →
 * DB chain, not a mocked substitute.
 *
 * The one deliberate difference from production: the global ThrottlerGuard
 * is overridden to always allow. Login's 5-req/min production limit is a
 * legitimate anti-brute-force control, but every request in a test run
 * shares one source IP, so a normal test suite calling /auth/login more
 * than 5 times would start getting 429s that have nothing to do with what
 * each test is actually checking. This is a test-harness override via
 * Nest's standard overrideGuard, not a change to app.module.ts.
 */
export async function createTestApp(): Promise<INestApplication> {
  await ensureMigrations();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue(alwaysAllow)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export function getDataSource(app: INestApplication): DataSource {
  return app.get(DataSource);
}

/**
 * Wipes every table between tests (or test files) so tenant-isolation and
 * duplicate-prevention assertions never depend on ordering or leftover
 * rows from a previous run. Tables are named explicitly (not a blanket
 * `TRUNCATE ... CASCADE` over `pg_tables`) so a forgotten new table fails
 * loudly (FK error) instead of silently going untruncated, or a typo'd
 * table silently vanishing from cleanup.
 */
export async function truncateAll(app: INestApplication): Promise<void> {
  const ds = getDataSource(app);
  const tables = [
    // `cms` schema tables. Untouched by any e2e spec before CMS-B.4
    // (CMS-A/B.1-B.3 only had unit specs), so they were never added
    // here — first real need is the media-upload e2e spec, which
    // creates Sites and MediaAssets that must not leak between tests.
    // media_assets first: it FKs to sites, and CASCADE handles the
    // rest, but explicit ordering keeps this list readable top-down.
    //
    // content_revisions added for CMS-C.5's e2e spec, the first to
    // exercise the generic revisions table — FKs to sites, same
    // ordering reasoning. (CMS-C.5 also introduced a throwaway
    // ProofBlock entity/`cms.proof_blocks` table to prove the pattern;
    // both were removed once real content types existed to serve as
    // the reference instead — see cms.module.ts's doc comment.)
    //
    // hero_items added for CMS-D.1's e2e spec — the first real,
    // non-disposable content type. FKs to sites (and, optionally,
    // media_assets), so it's truncated before both.
    //
    // about_items added for CMS-D.2's e2e spec — same reasoning.
    //
    // cta_items added for CMS-D.3's e2e spec — same reasoning.
    //
    // statistics/features/faqs added for the CMS-D.4/D.5/D.6 e2e specs
    // — same reasoning; features FKs to sites and, optionally,
    // media_assets, same as hero/about/cta.
    //
    // site_settings/navigation_items added for the CMS-E.1/E.2 e2e
    // specs — same reasoning. navigation_items additionally
    // self-references via parent_id (ON DELETE CASCADE), which
    // `TRUNCATE ... CASCADE` already handles regardless of row order.
    //
    // pages/news_articles/gallery_items/testimonials/teacher_profiles/
    // campuses added for the CMS-F.1/F.2/G.1/G.2/H.1/H.2/H.3/H.4 e2e
    // specs — same reasoning; each FKs to sites (and, where noted
    // above, optionally media_assets).
    'cms.cta_items',
    'cms.statistics',
    'cms.features',
    'cms.faqs',
    'cms.site_settings',
    'cms.navigation_items',
    'cms.pages',
    'cms.news_articles',
    'cms.gallery_items',
    'cms.testimonials',
    'cms.teacher_profiles',
    'cms.campuses',
    'cms.about_items',
    'cms.hero_items',
    'cms.media_assets',
    'cms.content_revisions',
    'cms.sites',
    'audit_logs',
    'school_settings',
    'homework',
    'timetable_entries',
    'announcements',
    'attendance',
    'teacher_assignments',
    'student_assessments',
    'subjects',
    'notifications',
    'financial_ledger',
    'receipt_counters',
    'payments',
    'installments',
    'tuition_plans',
    'parent_students',
    'students',
    'guardians',
    'grades',
    'academic_years',
    'users',
    'schools',
  ];
  await ds.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

export async function closeMigrationDataSource(): Promise<void> {
  if (migrationDataSource.isInitialized) {
    await migrationDataSource.destroy();
  }
}
