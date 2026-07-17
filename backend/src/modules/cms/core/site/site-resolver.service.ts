import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';

/**
 * CMS-I.1. `resolveByDomain` was the CMS-A.3 stub's only method — this
 * sub-phase adds the two remaining pieces the roadmap's §3.9 seam needs:
 *
 * - `resolveBySlug`: a dev-only convenience so a developer can select a
 *   Site without editing `/etc/hosts` or faking a `Host` header. There is
 *   no `slug` column on `Site` (see entity — deliberately minimal), so the
 *   "slug" is just the first label of `domain` (e.g. "nhg" for
 *   "nhg.example.com"). This keeps CMS-I.1 schema-free, per its file list.
 *   Disabled outright when `NODE_ENV=production` so it can never become a
 *   Host-header-bypass in a real deployment.
 * - `resolveFromHost`: the actual entry point `PublicSiteContextGuard`
 *   calls. Normalizes the incoming `Host` header (strips port,
 *   lowercases) and tries `resolveByDomain` first; only if that misses
 *   AND a dev slug was supplied does it fall back to `resolveBySlug`.
 *
 * `resolveByDomain` itself is unchanged from CMS-A.3 — kept as its own
 * method (rather than inlined) since it's the one piece that's already
 * proven and other future callers may still want a direct domain lookup
 * without the header-parsing/fallback wrapper.
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

  /**
   * Dev-only fallback. Matches `slug` against the first label of each
   * Site's `domain` (case-insensitive). Never usable in production.
   */
  async resolveBySlug(slug: string): Promise<Site> {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException('Slug-based Site resolution is disabled in production');
    }

    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      throw new NotFoundException('Empty site slug');
    }

    const sites = await this.siteRepository.find();
    const match = sites.find(
      (site) => site.domain.split('.')[0].toLowerCase() === normalizedSlug,
    );
    if (!match) {
      throw new NotFoundException(`No Site found for dev slug "${normalizedSlug}"`);
    }
    return match;
  }

  /**
   * Entry point for the public API's Site resolution. `hostHeader` is
   * whatever the guard read off the request's `Host` header (may be
   * undefined for a malformed/absent header); `slug`, if given, is the
   * dev-fallback value from a query param or header — see
   * `PublicSiteContextGuard`. Domain resolution always wins when it
   * matches; the slug is only consulted on a miss (or no Host at all).
   */
  async resolveFromHost(hostHeader: string | undefined, slug?: string): Promise<Site> {
    const host = this.normalizeHost(hostHeader);

    if (host) {
      try {
        return await this.resolveByDomain(host);
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
        // fall through to slug fallback below
      }
    }

    if (slug) {
      return this.resolveBySlug(slug);
    }

    throw new NotFoundException(
      host
        ? `No Site configured for host "${host}"`
        : 'No Host header present and no dev site slug provided',
    );
  }

  private normalizeHost(hostHeader: string | undefined): string | null {
    if (!hostHeader) return null;
    // Host headers can carry a port ("nhg.example.com:3000") and, per
    // RFC 7230, are case-insensitive — strip/lowercase both before
    // comparing against the stored `domain` value.
    const withoutPort = hostHeader.split(':')[0]?.trim().toLowerCase();
    return withoutPort || null;
  }
}
