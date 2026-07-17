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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CacheInvalidationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ioredis_1 = __importDefault(require("ioredis"));
const cms_domain_events_1 = require("../../events/cms-domain-events");
const public_cache_interceptor_1 = require("../interceptors/public-cache.interceptor");
let CacheInvalidationListener = CacheInvalidationListener_1 = class CacheInvalidationListener {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(CacheInvalidationListener_1.name);
    }
    async onContentPublished(event) {
        await this.invalidateSite(event.siteId);
    }
    async onContentUnpublished(event) {
        await this.invalidateSite(event.siteId);
    }
    async onContentUpdated(event) {
        await this.invalidateSite(event.siteId);
    }
    async invalidateSite(siteId) {
        const pattern = (0, public_cache_interceptor_1.buildPublicCacheSitePattern)(siteId);
        let cursor = '0';
        let deleted = 0;
        try {
            do {
                const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    deleted += await this.redis.del(...keys);
                }
            } while (cursor !== '0');
        }
        catch (error) {
            this.logger.warn(`Public cache invalidation failed for site "${siteId}": ${error.message}`);
        }
        return deleted;
    }
};
exports.CacheInvalidationListener = CacheInvalidationListener;
__decorate([
    (0, event_emitter_1.OnEvent)(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_PUBLISHED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_domain_events_1.ContentPublishedEvent]),
    __metadata("design:returntype", Promise)
], CacheInvalidationListener.prototype, "onContentPublished", null);
__decorate([
    (0, event_emitter_1.OnEvent)(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_UNPUBLISHED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_domain_events_1.ContentUnpublishedEvent]),
    __metadata("design:returntype", Promise)
], CacheInvalidationListener.prototype, "onContentUnpublished", null);
__decorate([
    (0, event_emitter_1.OnEvent)(cms_domain_events_1.CMS_DOMAIN_EVENTS.CONTENT_UPDATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cms_domain_events_1.ContentUpdatedEvent]),
    __metadata("design:returntype", Promise)
], CacheInvalidationListener.prototype, "onContentUpdated", null);
exports.CacheInvalidationListener = CacheInvalidationListener = CacheInvalidationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(public_cache_interceptor_1.PUBLIC_CACHE_REDIS)),
    __metadata("design:paramtypes", [ioredis_1.default])
], CacheInvalidationListener);
//# sourceMappingURL=cache-invalidation.listener.js.map