/**
 * `LocalizedText` — CMS-C.3. Shape of every translatable `jsonb` column
 * on a CMS content entity (§4.2 of docs/architecture/CMS_ARCHITECTURE.md),
 * e.g. `NewsArticle.title`/`NewsArticle.body`. Keyed by locale code
 * (`"en"`, `"fa"`, ...), matching `Site.supportedLocales` (CMS-A/§2) —
 * there is deliberately no dedicated translation table; resolution
 * against a requested locale, with fallback to the owning `Site`'s
 * `defaultLocale`, is `LocaleResolverService`'s job (this sub-phase),
 * not a concern of the type itself.
 */
export type LocalizedText = Record<string, string>;
