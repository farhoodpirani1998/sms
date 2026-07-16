import { Module } from '@nestjs/common';
import { AuditModule } from '../../../../common/audit/audit.module';
import { PublishingService } from './publishing.service';
import { ScheduledPublishCron } from './scheduled-publish.cron';

/**
 * `PublishingModule` — CMS-C.4. Imports `AuditModule` for `AuditService`
 * (reused exactly as implemented, per architecture §1) — `EventEmitter2`
 * needs no import since `EventEmitterModule.forRoot({ global: true })`
 * is already registered once in `AppModule`, same reason
 * `RevisionsModule` doesn't import it either. `ScheduleModule.forRoot()`
 * is likewise already registered once, in `SchedulerModule` — `@Cron`
 * providers just need to exist somewhere in the module graph, not
 * re-import `ScheduleModule` themselves (see `OverdueInstallmentsCron`
 * for the existing precedent).
 *
 * `PublishingService` is exported so `content/*` services (CMS-D
 * onward) can inject it directly to implement their own `publish()`/
 * `unpublish()`/`schedule()` controller actions, and so each content
 * module can call `registerSchedulable()` from its own `onModuleInit()`.
 */
@Module({
  imports: [AuditModule],
  providers: [PublishingService, ScheduledPublishCron],
  exports: [PublishingService],
})
export class PublishingModule {}
