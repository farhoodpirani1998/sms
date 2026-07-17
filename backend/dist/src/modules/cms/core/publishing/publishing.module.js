"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishingModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../../../../common/audit/audit.module");
const publishing_service_1 = require("./publishing.service");
const scheduled_publish_cron_1 = require("./scheduled-publish.cron");
let PublishingModule = class PublishingModule {
};
exports.PublishingModule = PublishingModule;
exports.PublishingModule = PublishingModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        providers: [publishing_service_1.PublishingService, scheduled_publish_cron_1.ScheduledPublishCron],
        exports: [publishing_service_1.PublishingService],
    })
], PublishingModule);
//# sourceMappingURL=publishing.module.js.map