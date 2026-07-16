/**
 * Publishing lifecycle shared by every CMS content type (§4.3 of
 * docs/architecture/CMS_ARCHITECTURE.md). `DRAFT → IN_REVIEW → PUBLISHED`
 * is the normal path; `SCHEDULED` and `ARCHIVED` are side states.
 *
 * This is CMS-A.2 scaffolding only — the state-transition behavior
 * (`publish()`, `unpublish()`, `schedule()` on `BaseContentService`, the
 * scheduled-publish cron) is CMS-C, not this sub-phase.
 */
export enum ContentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}
