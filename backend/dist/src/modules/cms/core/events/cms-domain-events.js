"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionRestoredEvent = exports.ContentReorderedEvent = exports.ContentScheduledEvent = exports.ContentUnpublishedEvent = exports.ContentPublishedEvent = exports.ContentDeletedEvent = exports.ContentUpdatedEvent = exports.ContentCreatedEvent = exports.CMS_DOMAIN_EVENTS = void 0;
exports.CMS_DOMAIN_EVENTS = {
    CONTENT_CREATED: 'cms.content.created',
    CONTENT_UPDATED: 'cms.content.updated',
    CONTENT_DELETED: 'cms.content.deleted',
    CONTENT_PUBLISHED: 'cms.content.published',
    CONTENT_UNPUBLISHED: 'cms.content.unpublished',
    CONTENT_SCHEDULED: 'cms.content.scheduled',
    CONTENT_REORDERED: 'cms.content.reordered',
    REVISION_RESTORED: 'cms.revision.restored',
};
class ContentCreatedEvent {
    constructor(entityType, entityId, siteId, performedBy) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.performedBy = performedBy;
    }
}
exports.ContentCreatedEvent = ContentCreatedEvent;
class ContentUpdatedEvent {
    constructor(entityType, entityId, siteId, performedBy) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.performedBy = performedBy;
    }
}
exports.ContentUpdatedEvent = ContentUpdatedEvent;
class ContentDeletedEvent {
    constructor(entityType, entityId, siteId, performedBy) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.performedBy = performedBy;
    }
}
exports.ContentDeletedEvent = ContentDeletedEvent;
class ContentPublishedEvent {
    constructor(entityType, entityId, siteId, performedBy, publishedAt) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.performedBy = performedBy;
        this.publishedAt = publishedAt;
    }
}
exports.ContentPublishedEvent = ContentPublishedEvent;
class ContentUnpublishedEvent {
    constructor(entityType, entityId, siteId, performedBy) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.performedBy = performedBy;
    }
}
exports.ContentUnpublishedEvent = ContentUnpublishedEvent;
class ContentScheduledEvent {
    constructor(entityType, entityId, siteId, performedBy, scheduledAt) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.performedBy = performedBy;
        this.scheduledAt = scheduledAt;
    }
}
exports.ContentScheduledEvent = ContentScheduledEvent;
class ContentReorderedEvent {
    constructor(entityType, siteId, orderedIds, performedBy) {
        this.entityType = entityType;
        this.siteId = siteId;
        this.orderedIds = orderedIds;
        this.performedBy = performedBy;
    }
}
exports.ContentReorderedEvent = ContentReorderedEvent;
class RevisionRestoredEvent {
    constructor(entityType, entityId, siteId, revisionId, performedBy) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.siteId = siteId;
        this.revisionId = revisionId;
        this.performedBy = performedBy;
    }
}
exports.RevisionRestoredEvent = RevisionRestoredEvent;
//# sourceMappingURL=cms-domain-events.js.map