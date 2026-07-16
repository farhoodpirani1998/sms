import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CMS-A.1 — Foundation, step 1 of 2.
 *
 * Creates the `cms` Postgres schema that every CMS table lives in. Same
 * database, same `DATABASE_URL`, same connection pool as the rest of the
 * app (see docs/architecture/CMS_ARCHITECTURE.md §1) — this is a schema
 * namespace, not a second database. `pgcrypto` (for `gen_random_uuid()`)
 * is already enabled globally by InitSchema, so no extension work is
 * needed here.
 *
 * Deliberately empty otherwise: no tables are created in this migration
 * so that "create the namespace" and "create the first table in it"
 * (CmsSite, next migration) stay independently revertable.
 */
export class CreateCmsSchema1737600000000 implements MigrationInterface {
  name = 'CreateCmsSchema1737600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS cms`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS cms CASCADE`);
  }
}
