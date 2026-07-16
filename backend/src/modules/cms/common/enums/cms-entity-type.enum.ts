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
export enum CmsEntityType {
  MEDIA_ASSET = 'media_asset',
  PROOF_BLOCK = 'proof_block',
}
