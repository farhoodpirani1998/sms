import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';

/**
 * CMS-A.3 stub. `resolveByDomain` is the seam every later public-facing
 * CMS piece (public controllers, sitemap/robots, cache keys) will call to
 * turn an incoming request into a `Site` — but full Host-header wiring
 * (reading the actual `Host` header off the request, the slug-based dev
 * fallback) is CMS-I.1's job, per docs/architecture/CMS_ARCHITECTURE.md
 * §3.9 and the roadmap. This sub-phase only proves the lookup itself
 * works against `cms.sites`, with no HTTP-layer plumbing yet — nothing
 * depends on this service until CMS-I.1 wires a guard on top of it.
 */
@Injectable()
export class SiteResolverService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
  ) {}

  async resolveByDomain(domain: string): Promise<Site> {
    const site = await this.siteRepository.findOne({ where: { domain } });
    if (!site) {
      throw new NotFoundException(`No Site configured for domain "${domain}"`);
    }
    return site;
  }
}
