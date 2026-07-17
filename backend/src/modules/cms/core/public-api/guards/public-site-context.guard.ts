import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SiteResolverService } from '../../site/site-resolver.service';
import { Site } from '../../site/entities/site.entity';

// Query param / header a developer can use in place of a real Host
// header to pick a Site locally — see SiteResolverService.resolveBySlug
// for why it's a slug derived from `domain`, and why it's a no-op in
// production.
const DEV_SITE_SLUG_QUERY_PARAM = 'site';
const DEV_SITE_SLUG_HEADER = 'x-cms-site-slug';

export interface RequestWithCmsSite extends Request {
  cmsSite?: Site;
}

/**
 * CMS-I.1. Resolves the `Site` for an incoming public-API request and
 * attaches it to `request.cmsSite` — nothing else. Per the roadmap's
 * CMS-I.1 scope, this guard is deliberately NOT wired onto any public
 * controller yet; that happens per content-group in CMS-I.3–I.5, once
 * `PublicCacheInterceptor` (CMS-I.2) also exists to pair with it.
 *
 * All the actual resolution logic (Host-header lookup, dev slug
 * fallback) lives in `SiteResolverService` — this guard only reads the
 * two candidate inputs off the request and hands them off.
 */
@Injectable()
export class PublicSiteContextGuard implements CanActivate {
  constructor(private readonly siteResolver: SiteResolverService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCmsSite>();

    const host = request.headers?.host;
    const slugParam = request.query?.[DEV_SITE_SLUG_QUERY_PARAM];
    const slugHeader = request.headers?.[DEV_SITE_SLUG_HEADER];
    const slug = this.firstString(slugParam) ?? this.firstString(slugHeader);

    const site = await this.siteResolver.resolveFromHost(host, slug);
    request.cmsSite = site;

    return true;
  }

  private firstString(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  }
}
