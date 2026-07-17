"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScheduledPublishCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledPublishCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const publishing_service_1 = require("./publishing.service");
const SCHEDULED_PUBLISH_CRON_LOCK_KEY = 721_900_002;
let ScheduledPublishCron = ScheduledPublishCron_1 = class ScheduledPublishCron {
    constructor(publishingService, dataSource) {
        this.publishingService = publishingService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ScheduledPublishCron_1.name);
    }
    async handleScheduledPublish() {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            const [{ locked }] = await queryRunner.query('SELECT pg_try_advisory_lock($1) AS locked', [SCHEDULED_PUBLISH_CRON_LOCK_KEY]);
            if (!locked) {
                return;
            }
            try {
                const publishedCount = await this.publishingService.runScheduledPublish();
                if (publishedCount > 0) {
                    this.logger.log(`Scheduled-publish run published ${publishedCount} row(s)`);
                }
            }
            catch (err) {
                this.logger.error('Scheduled-publish run failed', err);
            }
            finally {
                await queryRunner.query('SELECT pg_advisory_unlock($1)', [
                    SCHEDULED_PUBLISH_CRON_LOCK_KEY,
                ]);
            }
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.ScheduledPublishCron = ScheduledPublishCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduledPublishCron.prototype, "handleScheduledPublish", null);
exports.ScheduledPublishCron = ScheduledPublishCron = ScheduledPublishCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [publishing_service_1.PublishingService,
        typeorm_2.DataSource])
], ScheduledPublishCron);
//# sourceMappingURL=scheduled-publish.cron.js.map