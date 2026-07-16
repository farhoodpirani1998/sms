import { Module } from '@nestjs/common';
import { OrderingService } from './ordering.service';

/**
 * `OrderingModule` — CMS-C.4. No imports needed: `DataSource` is
 * globally available once `TypeOrmModule.forRoot()` runs in `AppModule`
 * (its internal core module is `@Global()`, same reason
 * `OverdueInstallmentsCron` injects `DataSource` without `SchedulerModule`
 * importing `TypeOrmModule` itself), and `EventEmitter2` is global too
 * (see `PublishingModule`'s doc comment).
 */
@Module({
  providers: [OrderingService],
  exports: [OrderingService],
})
export class OrderingModule {}
