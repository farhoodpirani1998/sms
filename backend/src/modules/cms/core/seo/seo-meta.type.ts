/**
 * `ResolvedSeoMeta` — CMS-F.2. The locale-resolved, request-ready shape
 * every public content read returns for its SEO fields — distinct from
 * `Site.seoDefaults` (`SeoMeta` on `core/site/entities/site.entity.ts`,
 * CMS-A.2), which stores a Site's *unresolved*, per-locale defaults.
 * `LocaleResolverService.resolveText()` (CMS-C.3) is what turns a
 * `LocalizedText` column plus a resolved locale into the plain strings
 * here; falling back to `Site.seoDefaults` when a content row has no
 * SEO fields of its own is each content service's job (e.g.
 * `PagesService.findPublishedBySlug()`), not this type's.
 *
 * `canonicalUrl` is always a concrete absolute URL (built from
 * `Site.domain` + the content's own slug/path) — never null — since
 * every publicly-readable page has exactly one canonical address.
 * `ogImageUrl` is the resolved public URL for `ogImageMediaId`
 * (resolving a `MediaAsset` id to a servable URL is `MediaService`'s
 * job, CMS-B.4 — this type only carries the already-resolved string).
 */
export interface ResolvedSeoMeta {
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string;
}
