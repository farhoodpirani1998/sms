import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

/**
 * Admin CRUD over `cms.sites`. Only one row exists today (NHG, seeded by
 * the CmsSite migration) but this is written generically per
 * docs/architecture/CMS_ARCHITECTURE.md §1/§2 — a second Site is a
 * `create()` call, not a schema or code change.
 *
 * Deliberately has no `siteId` scoping parameter on any method: unlike
 * every content-type service (later phases), Site itself is the thing
 * being scoped, not scoped by something else.
 */
@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
  ) {}

  async findAll(): Promise<Site[]> {
    return this.siteRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.siteRepository.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
    return site;
  }

  async create(dto: CreateSiteDto): Promise<Site> {
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

  async update(id: string, dto: UpdateSiteDto): Promise<Site> {
    const site = await this.findOne(id);

    if (dto.domain !== undefined && dto.domain !== site.domain) {
      await this.assertDomainAvailable(dto.domain);
    }

    Object.assign(site, dto);
    return this.siteRepository.save(site);
  }

  private async assertDomainAvailable(domain: string): Promise<void> {
    const existing = await this.siteRepository.findOne({ where: { domain } });
    if (existing) {
      throw new ConflictException(`A Site with domain "${domain}" already exists`);
    }
  }
}
