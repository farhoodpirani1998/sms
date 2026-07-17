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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderingService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("typeorm");
const cms_domain_events_1 = require("../events/cms-domain-events");
let OrderingService = class OrderingService {
    constructor(dataSource, events) {
        this.dataSource = dataSource;
        this.events = events;
    }
    async reorder(repository, entityType, siteId, orderedIds, userId) {
        if (orderedIds.length === 0) {
            return;
        }
        if (new Set(orderedIds).size !== orderedIds.length) {
            throw new common_1.BadRequestException('orderedIds must not contain duplicates');
        }
        await this.dataSource.transaction(async (manager) => {
            const txRepository = manager.withRepository(repository);
            const rows = await txRepository.find({
                where: { id: (0, typeorm_1.In)(orderedIds), siteId },
            });
            if (rows.length !== orderedIds.length) {
                throw new common_1.BadRequestException('One or more ids do not exist for this Site — reorder was not applied');
            }
            await Promise.all(orderedIds.map((id, index) => txRepository.update({ id, siteId }, { sortOrder: index })));
        });
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_REORDERED, new cms_domain_events_1.ContentReorderedEvent(entityType, siteId, orderedIds, userId));
    }
};
exports.OrderingService = OrderingService;
exports.OrderingService = OrderingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        event_emitter_1.EventEmitter2])
], OrderingService);
//# sourceMappingURL=ordering.service.js.map