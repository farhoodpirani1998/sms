import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PublishingService } from './publishing.service';

// Arbitrary fixed key for Postgres advisory locking, same pattern and
// same reasoning as OVERDUE_CRON_LOCK_KEY in
// modules/scheduler/overdue-installments.cron.ts — must be unique across
// every advisory lock in this codebase, picked once and never reused.
const SCHEDULED_PUBLISH_CRON_LOCK_KEY = 721_900_002;

/**
 * `ScheduledPublishCron` — CMS-C.4. Site-agnostic: it doesn't take a
 * Site parameter at all, since `PublishingService.runScheduledPublish()`
 * (this sub-phase) scans every registered content type's `SCHEDULED`
 * rows across every Site in one pass, per docs/architecture/
 * CMS_ARCHITECTURE.md §4.3 ("it just scans for SCHEDULED rows whose
 * scheduledAt <= now() across all Sites").
 *
 * Runs every minute rather than the once-nightly cadence
 * `OverdueInstallmentsCron` uses — a scheduled publish is a
 * content-editor-facing feature ("go live at 9:00 AM"), so it needs to
 * fire close to the requested time, not once a day.
 *
 * Uses the same Postgres-advisory-lock pattern as
 * `OverdueInstallmentsCron` for the same reason: `@nestjs/schedule`'s
 * `@Cron` runs independently on every instance in a multi-instance
 * deployment, so without a lock N instances would all try to publish
 * the same due rows in the same tick.
 */
@Injectable()
export class ScheduledPublishCron {
  private readonly logger = new Logger(ScheduledPublishCron.name);

  constructor(
    private readonly publishingService: PublishingService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublish(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const [{ locked }]: [{ locked: boolean }] = await queryRunner.query(
        'SELECT pg_try_advisory_lock($1) AS locked',
        [SCHEDULED_PUBLISH_CRON_LOCK_KEY],
      );

      if (!locked) {
        return;
      }

      try {
        const publishedCount = await this.publishingService.runScheduledPublish();
        if (publishedCount > 0) {
          this.logger.log(`Scheduled-publish run published ${publishedCount} row(s)`);
        }
      } catch (err) {
        this.logger.error('Scheduled-publish run failed', err as Error);
      } finally {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [
          SCHEDULED_PUBLISH_CRON_LOCK_KEY,
        ]);
      }
    } finally {
      await queryRunner.release();
    }
  }
}
