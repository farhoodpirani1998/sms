# CMS-A.2 delivery

Cross-cutting foundation pieces the content types (CMS-D onward) will
extend: ContentStatus enum, BaseCmsEntity, and the CMS_* Permission
enum + role grants. Also swaps SiteController's temporary
`@Roles('school_admin')`-only gate for the real
`@RequirePermission(Permission.CMS_SITE_MANAGE)`, now that the
permission exists.

## Files
- src/common/authorization/permissions.ts        (modified — added 4 CMS_* permissions + role grants)
- src/common/authorization/permissions.spec.ts    (modified — added CMS grant/deny test cases)
- src/modules/cms/common/enums/content-status.enum.ts   (new)
- src/modules/cms/common/entities/base-cms.entity.ts    (new)
- src/modules/cms/core/site/site.controller.ts           (modified — real permission gate)

No migrations in this sub-phase — BaseCmsEntity isn't backed by any
table until a concrete content type extends it (CMS-D+).

## How to apply
Copy the src/ tree on top of the existing repo (permissions.ts,
permissions.spec.ts, and site.controller.ts are modifications —
merge/replace them; the rest are new files), then run the existing
test suite:

    npm test -- permissions.spec
