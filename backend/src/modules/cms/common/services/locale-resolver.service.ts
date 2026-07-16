import { Injectable } from '@nestjs/common';
import { SiteService } from '../../core/site/site.service';
import { LocalizedText } from '../interfaces/localized-text.type';

/**
 * `LocaleResolverService` — CMS-C.3. Generic locale-fallback logic used
 * by `BaseContentService` (this sub-phase) and, from CMS-D onward, by
 * every `content/*` service reading a `jsonb` localized column (§4.2 of
 * docs/architecture/CMS_ARCHITECTURE.md).
 *
 * There is no CMS-specific "current locale" concept independent of the
 * `Site` a request targets — `supportedLocales`/`defaultLocale` live on
 * `Site` (CMS-A, §2), not on a school or a global app setting — so this
 * service injects `SiteService` (exported by `SiteModule`, CMS-A.1)
 * rather than re-declaring a `Site` repository of its own.
 *
 * Not registered in any module yet: like `RevisionsService`, it's a
 * plain `@Injectable()` that whichever concrete content module wires up
 * (alongside `SiteModule`) provides for itself — no `LocaleResolverModule`
 * exists because there is nothing else to aggregate around it.
 */
@Injectable()
export class LocaleResolverService {
  constructor(private readonly siteService: SiteService) {}

  /**
   * Resolves which locale a request should be served in for a given
   * Site: the requested locale if the Site actually supports it,
   * otherwise the Site's `defaultLocale`. A missing/omitted requested
   * locale falls straight through to `defaultLocale` as well.
   */
  async resolve(siteId: string, requestedLocale?: string | null): Promise<string> {
    const site = await this.siteService.findOne(siteId);

    if (requestedLocale && site.supportedLocales.includes(requestedLocale)) {
      return requestedLocale;
    }

    return site.defaultLocale;
  }

  /**
   * Picks the display string out of a `LocalizedText` jsonb value for an
   * already-resolved locale, falling back to the Site's `defaultLocale`
   * entry, and finally to whatever entry happens to exist, rather than
   * returning `null`/`undefined` for content that was only ever entered
   * in one language. Returns `null` only when the column itself is
   * empty (never populated for any locale).
   */
  resolveText(
    localized: LocalizedText | null | undefined,
    locale: string,
    defaultLocale: string,
  ): string | null {
    if (!localized) {
      return null;
    }

    if (localized[locale] !== undefined) {
      return localized[locale];
    }

    if (localized[defaultLocale] !== undefined) {
      return localized[defaultLocale];
    }

    const values = Object.values(localized);
    return values.length > 0 ? values[0] : null;
  }
}
