# CMS Handoff — Final Checks (post CMS-A–I.5)

This note records the results of the final handoff verification pass
requested once all 9 phases (34 sub-phases, CMS-A through CMS-I.5) were
complete. It doesn't change CMS architecture or any content module's
behavior — see "Actions taken" for the one exception (deleted
scaffolding) explicitly called for by the roadmap itself.

## 1. Import boundary: `modules/cms/**` must not import `modules/school/**`

**Status: clean, no violations found.**

Checked two ways:
- Direct string search for `from '...modules/school...'` across
  `src/modules/cms/`.
- A resolved-path check that follows every relative import
  (`from '../../whatever'`) in `src/modules/cms/` to its normalized
  filesystem path and flags any that land under `modules/school`.

Both came back empty. The handful of `modules/school` string matches
that do exist in this tree are all inside doc comments (e.g.
`teachers.module.ts`, `site.entity.ts`, `cms-domain-events.ts`) that
*assert* the boundary rather than cross it — for example
`TeacherProfile` explicitly documents that it has no relation to the
School-domain `Teacher`. No code changes were needed.

## 2. Deferred items review

### Thumbnailing (CMS-B.5)

**Status: shipped, not deferred.** Despite CMS-B.5 being marked
optional/deferred in the roadmap, `MediaProcessingQueue` and
`MediaProcessingProcessor` (`core/media/`) are fully implemented and
wired into `MediaModule` — image uploads enqueue an async BullMQ job
that generates a resized thumbnail via `sharp` and backfills
`MediaAsset.width`/`height`. This corrects the roadmap's own
assumption; later phases should treat thumbnails as present, not
optional. (The in-code doc comments still say "deferred/optional" in a
couple of places — left as-is since updating content-module/core
comments wasn't in scope for this pass, and the behavior itself is
unambiguous from the wiring in `media.module.ts`.)

### Storage decision: local vs S3

**Status: both implemented; no production choice has been made or
implemented here, per instructions.** `storageProviderFactory`
(`core/media/storage/storage-provider.factory.ts`) selects
`LocalDiskStorageProvider` or `S3StorageProvider` at runtime from
`MEDIA_STORAGE_DRIVER` (defaulting to `local`), with `S3` requiring
`MEDIA_S3_BUCKET`/`MEDIA_S3_REGION`/`MEDIA_S3_ACCESS_KEY_ID`/
`MEDIA_S3_SECRET_ACCESS_KEY`. Switching drivers is purely an env-var
change — no code path assumes one or the other. Nothing in the
deployment docs (`docs/deployment/DEPLOYMENT.md`) currently states
which driver production should run, so that remains an open
deployment decision, not a code gap. This report only documents that
status; it does not pick or configure a driver.

## 3. Removed obsolete `_proof` module

**Status: removed.** `content/_proof/` was CMS-C.5's disposable
`ProofBlock` entity/DTOs/service/controller/module, kept around only
"as a reference" per its own doc comments and `cms.module.ts`'s. Now
that all 14 real content types exist, it has been deleted:

- `src/modules/cms/content/_proof/` (entity, both DTOs, service,
  controller, module) — entire directory removed.
- `cms.module.ts` — `ProofBlockModule` import and registration removed;
  doc comment updated to reflect the removal.
- `CmsEntityType.PROOF_BLOCK` (`common/enums/cms-entity-type.enum.ts`)
  — removed; that enum's own comment already flagged this as bundled
  with deleting `_proof`.
- `test/cms-proof-block.e2e-spec.ts` — deleted (tested a now-deleted
  module).
- `test/setup/test-app.ts` — `cms.proof_blocks` removed from
  `truncateAll`'s table list.
- `cms.proof_blocks` table — dropped via a **new** migration
  (`1738600000000-DropCmsProofBlock.ts`) rather than editing the
  original `1738000000000-CmsProofBlock.ts`, so migration history for
  any environment that already ran the original stays intact. The new
  migration's `down()` recreates the table verbatim so the pair is
  fully reversible.

No other content module, DTO, controller, or service was modified.

## Validation summary

| Check | Result |
|---|---|
| Import boundary (`modules/cms` → `modules/school`) | Pass — no violations |
| Thumbnailing (CMS-B.5) status | Corrected: shipped (not deferred) |
| Storage decision (local vs S3) | Documented only — both implemented, production choice still open, nothing implemented here |
| `_proof` scaffolding removed | Done — code, enum entry, e2e spec, truncateAll entry, schema (via new migration) |
| CMS architecture / content-module behavior changed | No |
