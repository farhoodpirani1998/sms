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
exports.SiteResolverService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const site_entity_1 = require("./entities/site.entity");
let SiteResolverService = class SiteResolverService {
    constructor(siteRepository) {
        this.siteRepository = siteRepository;
    }
    async resolveByDomain(domain) {
        const site = await this.siteRepository.findOne({ where: { domain } });
        if (!site) {
            throw new common_1.NotFoundException(`No Site configured for domain "${domain}"`);
        }
        return site;
    }
    async resolveBySlug(slug) {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.NotFoundException('Slug-based Site resolution is disabled in production');
        }
        const normalizedSlug = slug.trim().toLowerCase();
        if (!normalizedSlug) {
            throw new common_1.NotFoundException('Empty site slug');
        }
        const sites = await this.siteRepository.find();
        const match = sites.find((site) => site.domain.split('.')[0].toLowerCase() === normalizedSlug);
        if (!match) {
            throw new common_1.NotFoundException(`No Site found for dev slug "${normalizedSlug}"`);
        }
        return match;
    }
    async resolveFromHost(hostHeader, slug) {
        const host = this.normalizeHost(hostHeader);
        if (host) {
            try {
                return await this.resolveByDomain(host);
            }
            catch (error) {
                if (!(error instanceof common_1.NotFoundException)) {
                    throw error;
                }
            }
        }
        if (slug) {
            return this.resolveBySlug(slug);
        }
        throw new common_1.NotFoundException(host
            ? `No Site configured for host "${host}"`
            : 'No Host header present and no dev site slug provided');
    }
    normalizeHost(hostHeader) {
        if (!hostHeader)
            return null;
        const withoutPort = hostHeader.split(':')[0]?.trim().toLowerCase();
        return withoutPort || null;
    }
};
exports.SiteResolverService = SiteResolverService;
exports.SiteResolverService = SiteResolverService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(site_entity_1.Site)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SiteResolverService);
//# sourceMappingURL=site-resolver.service.js.map