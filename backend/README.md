# CMS-A.1 delivery

Foundation sub-phase: Postgres `cms` schema + `Site` entity/table/seed +
admin CRUD module, wired into AppModule. BaseCmsEntity, ContentStatus,
and the CMS_* Permission enum are deferred to CMS-A.2.

## How to apply

Copy the `src/` tree in this zip on top of the existing backend repo
(paths match 1:1 — 2 new migrations, 1 new app.module.ts to merge/replace,
and the new src/modules/cms/ tree), then:

    npm run migration:run

## Files
- src/database/migrations/1737600000000-CreateCmsSchema.ts   (new)
- src/database/migrations/1737700000000-CmsSite.ts            (new)
- src/app.module.ts                                            (modified — added CmsModule import)
- src/modules/cms/cms.module.ts                                (new)
- src/modules/cms/core/site/site.module.ts                     (new)
- src/modules/cms/core/site/site.controller.ts                 (new)
- src/modules/cms/core/site/site.service.ts                    (new)
- src/modules/cms/core/site/entities/site.entity.ts             (new)
- src/modules/cms/core/site/dto/create-site.dto.ts              (new)
- src/modules/cms/core/site/dto/update-site.dto.ts              (new)
