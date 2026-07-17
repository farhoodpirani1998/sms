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
var PublicCacheInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicCacheInterceptor = exports.PUBLIC_CACHE_TTL_SECONDS = exports.PUBLIC_CACHE_KEY_PREFIX = exports.PUBLIC_CACHE_REDIS = void 0;
exports.buildPublicCacheKey = buildPublicCacheKey;
exports.buildPublicCacheSitePattern = buildPublicCacheSitePattern;
exports.createPublicCacheRedisClient = createPublicCacheRedisClient;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ioredis_1 = __importDefault(require("ioredis"));
const locale_resolver_service_1 = require("../../../common/services/locale-resolver.service");
exports.PUBLIC_CACHE_REDIS = Symbol('PUBLIC_CACHE_REDIS');
exports.PUBLIC_CACHE_KEY_PREFIX = 'cms:public';
exports.PUBLIC_CACHE_TTL_SECONDS = 60;
function buildPublicCacheKey(siteId, locale, route) {
    return `${exports.PUBLIC_CACHE_KEY_PREFIX}:${siteId}:${locale}:${route}`;
}
function buildPublicCacheSitePattern(siteId) {
    return `${exports.PUBLIC_CACHE_KEY_PREFIX}:${siteId}:*`;
}
function createPublicCacheRedisClient() {
    const client = new ioredis_1.default({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
    });
    client.on('error', () => undefined);
    client.onModuleDestroy = async () => {
        client.disconnect();
    };
    return client;
}
let PublicCacheInterceptor = PublicCacheInterceptor_1 = class PublicCacheInterceptor {
    constructor(redis, localeResolver) {
        this.redis = redis;
        this.localeResolver = localeResolver;
        this.logger = new common_1.Logger(PublicCacheInterceptor_1.name);
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET') {
            return next.handle();
        }
        const siteId = request.cmsSite?.id;
        if (!siteId) {
            return next.handle();
        }
        const key = await this.buildKey(request, siteId);
        const cached = await this.safeGet(key);
        if (cached !== null) {
            return (0, rxjs_1.of)(JSON.parse(cached));
        }
        return next.handle().pipe((0, operators_1.tap)((body) => {
            void this.safeSet(key, body);
        }));
    }
    async buildKey(request, siteId) {
        const requestedLocale = this.firstString(request.query?.locale);
        const locale = await this.localeResolver.resolve(siteId, requestedLocale ?? null);
        const route = (request.originalUrl ?? request.url).split('?')[0];
        return buildPublicCacheKey(siteId, locale, route);
    }
    firstString(value) {
        if (typeof value === 'string')
            return value;
        if (Array.isArray(value) && typeof value[0] === 'string')
            return value[0];
        return undefined;
    }
    async safeGet(key) {
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            this.logger.warn(`Public cache read failed for "${key}": ${error.message}`);
            return null;
        }
    }
    async safeSet(key, body) {
        try {
            await this.redis.set(key, JSON.stringify(body), 'EX', exports.PUBLIC_CACHE_TTL_SECONDS);
        }
        catch (error) {
            this.logger.warn(`Public cache write failed for "${key}": ${error.message}`);
        }
    }
};
exports.PublicCacheInterceptor = PublicCacheInterceptor;
exports.PublicCacheInterceptor = PublicCacheInterceptor = PublicCacheInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.PUBLIC_CACHE_REDIS)),
    __metadata("design:paramtypes", [ioredis_1.default,
        locale_resolver_service_1.LocaleResolverService])
], PublicCacheInterceptor);
//# sourceMappingURL=public-cache.interceptor.js.map