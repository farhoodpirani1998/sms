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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const content_revision_entity_1 = require("./entities/content-revision.entity");
const cms_entity_type_enum_1 = require("../../common/enums/cms-entity-type.enum");
const cms_domain_events_1 = require("../events/cms-domain-events");
let RevisionsService = class RevisionsService {
    constructor(revisionRepository, events) {
        this.revisionRepository = revisionRepository;
        this.events = events;
    }
    async snapshot(entityType, entityId, siteId, payload, createdById) {
        const revision = this.revisionRepository.create({
            entityType,
            entityId,
            siteId,
            snapshot: payload,
            createdById,
        });
        return this.revisionRepository.save(revision);
    }
    async list(entityType, entityId) {
        const validEntityType = this.assertValidEntityType(entityType);
        return this.revisionRepository.find({
            where: { entityType: validEntityType, entityId },
            order: { createdAt: 'DESC' },
        });
    }
    async restore(entityType, entityId, revisionId, performedBy) {
        const validEntityType = this.assertValidEntityType(entityType);
        const revision = await this.revisionRepository.findOne({
            where: { id: revisionId, entityType: validEntityType, entityId },
        });
        if (!revision) {
            throw new common_1.NotFoundException('Revision not found');
        }
        this.events.emit(cms_domain_events_1.CMS_DOMAIN_EVENTS.REVISION_RESTORED, new cms_domain_events_1.RevisionRestoredEvent(validEntityType, entityId, revision.siteId, revision.id, performedBy));
        return revision;
    }
    assertValidEntityType(entityType) {
        const values = Object.values(cms_entity_type_enum_1.CmsEntityType);
        if (!values.includes(entityType)) {
            throw new common_1.BadRequestException(`Unknown CMS entity type: ${entityType}`);
        }
        return entityType;
    }
};
exports.RevisionsService = RevisionsService;
exports.RevisionsService = RevisionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_revision_entity_1.ContentRevision)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], RevisionsService);
//# sourceMappingURL=revisions.service.js.map