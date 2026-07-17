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
exports.SiteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const site_entity_1 = require("./entities/site.entity");
let SiteService = class SiteService {
    constructor(siteRepository) {
        this.siteRepository = siteRepository;
    }
    async findAll() {
        return this.siteRepository.find({ order: { createdAt: 'ASC' } });
    }
    async findOne(id) {
        const site = await this.siteRepository.findOne({ where: { id } });
        if (!site) {
            throw new common_1.NotFoundException('Site not found');
        }
        return site;
    }
    async create(dto) {
        await this.assertDomainAvailable(dto.domain);
        const site = this.siteRepository.create({
            name: dto.name,
            domain: dto.domain,
            defaultLocale: dto.defaultLocale,
            supportedLocales: dto.supportedLocales,
            theme: dto.theme ?? null,
            socialLinks: dto.socialLinks ?? null,
            seoDefaults: dto.seoDefaults ?? null,
        });
        return this.siteRepository.save(site);
    }
    async update(id, dto) {
        const site = await this.findOne(id);
        if (dto.domain !== undefined && dto.domain !== site.domain) {
            await this.assertDomainAvailable(dto.domain);
        }
        Object.assign(site, dto);
        return this.siteRepository.save(site);
    }
    async assertDomainAvailable(domain) {
        const existing = await this.siteRepository.findOne({ where: { domain } });
        if (existing) {
            throw new common_1.ConflictException(`A Site with domain "${domain}" already exists`);
        }
    }
};
exports.SiteService = SiteService;
exports.SiteService = SiteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(site_entity_1.Site)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SiteService);
//# sourceMappingURL=site.service.js.map