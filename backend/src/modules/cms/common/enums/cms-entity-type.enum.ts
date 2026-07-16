// CMS-A.1 — Foundation (this file itself), first populated by CMS-B.1.
//
// This enum exists so `ContentRevision.entityType` (CMS-C) and the
// public-API/revision plumbing have a single closed set to key off. It
// started empty at CMS-A.1 (no content type existed yet); CMS-B.1 adds
// the first entry (MEDIA_ASSET), and every later content sub-phase adds
// exactly one more as it lands.
//
// PROOF_BLOCK (CMS-C.5) is the disposable entry for the throwaway proof
// entity that exercises the full revisions/publishing/ordering/events
// stack before any real content type exists. Left in place for as long
// as the `_proof` module is (see that module's doc comment) — removing
// it is bundled with deleting `_proof`, not done separately here.
//
// HERO (CMS-D.1) is the first entry for a real, non-disposable content
// type — the reference implementation D.2–D.6 copy. The other five
// CMS-D tables (about/cta/statistics/features/faq) land in this same
// migration, but their enum entries are added by their own sub-phases,
// one at a time, same as every other content type going forward.
//
// ABOUT (CMS-D.2) confirms the pattern: one more entry, added exactly
// when its content type lands, nothing else about the enum changes.
//
// CTA (CMS-D.3) — same, one more entry for the third CMS-D content type.
//
// STATISTIC (CMS-D.4) — same, for the fourth CMS-D content type (the
// first list type where reorder sees real operational use).
//
// FEATURE (CMS-D.5) — same, for the fifth CMS-D content type.
//
// FAQ (CMS-D.6) — same, for the sixth and last CMS-D content type. All
// six simple content types now have an enum entry.
//
// SITE_SETTINGS (CMS-E.1) — first CMS-E entry, and the first singleton
// content type (see that entity's doc comment for what that means).
export enum CmsEntityType {
  MEDIA_ASSET = 'media_asset',
  PROOF_BLOCK = 'proof_block',
  HERO = 'hero',
  ABOUT = 'about',
  CTA = 'cta',
  STATISTIC = 'statistic',
  FEATURE = 'feature',
  FAQ = 'faq',
  SITE_SETTINGS = 'site_settings',
}
