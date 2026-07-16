import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-C.5: the throwaway `ProofBlock` entity, wired end-to-end.
 *
 * Proves that the cross-cutting stack built in isolation across
 * CMS-C.1–C.4 (`BaseContentService`, `RevisionsService`,
 * `PublishingService`, `OrderingService`, the CMS domain events, and
 * `AuditService`) actually composes correctly against a real table and
 * real HTTP requests:
 *
 * 1. create -> edit -> publish -> revision-restore round trip works.
 * 2. Every write (create/update/publish/restore) snapshots a new
 *    `ContentRevision` row.
 * 3. `publish()` requires `CMS_CONTENT_PUBLISH` (school_admin only) even
 *    though plain CRUD only requires `CMS_CONTENT_EDIT` (school_admin +
 *    staff) — proves the method-level `@RequirePermission` override.
 * 4. `reorder()` transactionally rewrites `sortOrder` for a real
 *    multi-row content type.
 * 5. Every write is scoped by `siteId` — a second Site's rows are
 *    invisible to the first.
 */
describe('CMS Proof Block (CMS-C.5 e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  let school: Awaited<ReturnType<typeof createSchool>>;
  let schoolAdmin: Awaited<ReturnType<typeof createUser>>;
  let staff: Awaited<ReturnType<typeof createUser>>;
  let accountant: Awaited<ReturnType<typeof createUser>>;
  let site: Awaited<ReturnType<typeof createSite>>;
  let otherSite: Awaited<ReturnType<typeof createSite>>;

  beforeEach(async () => {
    await truncateAll(app);

    school = await createSchool(app, { name: 'School A' });
    schoolAdmin = await createUser(app, { role: Role.SCHOOL_ADMIN, schoolId: school.id });
    staff = await createUser(app, { role: Role.STAFF, schoolId: school.id });
    accountant = await createUser(app, { role: Role.ACCOUNTANT, schoolId: school.id });

    // Site is a CMS-level concept, deliberately unrelated to School (see
    // Site entity doc comment) -- school above only exists to give the
    // test users a tenant, not because Site is scoped to it.
    site = await createSite(app);
    otherSite = await createSite(app);
  });

  it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
    // 1. Create (staff can, CMS_CONTENT_EDIT).
    const createRes = await request(server)
      .post('/api/v1/cms/proof-blocks')
      .set('Authorization', authHeader(app, staff))
      .send({ siteId: site.id, title: { en: 'Original title' } });

    expect(createRes.status).toBe(201);
    const blockId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.title).toEqual({ en: 'Original title' });
    expect(createRes.body.status).toBe('draft');

    // 2. Edit.
    const updateRes = await request(server)
      .patch(`/api/v1/cms/proof-blocks/${blockId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ title: { en: 'Edited title' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toEqual({ en: 'Edited title' });

    // Staff cannot publish -- CMS_CONTENT_PUBLISH is school_admin-only.
    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/proof-blocks/${blockId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    // 3. Publish (school_admin, CMS_CONTENT_PUBLISH).
    const publishRes = await request(server)
      .post(`/api/v1/cms/proof-blocks/${blockId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    // Every create/update/publish snapshotted a revision -- three so far.
    const revisionsAfterPublish = await request(server)
      .get(`/api/v1/cms/proof_block/${blockId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsAfterPublish.status).toBe(200);
    expect(revisionsAfterPublish.body.length).toBe(3);

    // The oldest revision (most-recent-first list, so last in the array)
    // is the one snapshotted right after create -- holds the original title.
    const originalRevision = revisionsAfterPublish.body[revisionsAfterPublish.body.length - 1];
    expect(originalRevision.snapshot.title).toEqual({ en: 'Original title' });

    // 4. Revision-restore round trip.
    const restoreRes = await request(server)
      .post(`/api/v1/cms/proof-blocks/${blockId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.title).toEqual({ en: 'Original title' });
    // Restoring content doesn't touch publish lifecycle state.
    expect(restoreRes.body.status).toBe('published');

    // Restoring is itself a new edit -- a fourth revision now exists.
    const revisionsAfterRestore = await request(server)
      .get(`/api/v1/cms/proof_block/${blockId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));
    expect(revisionsAfterRestore.body.length).toBe(4);

    // Final GET reflects the restored title.
    const finalGet = await request(server)
      .get(`/api/v1/cms/proof-blocks/${blockId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));
    expect(finalGet.body.title).toEqual({ en: 'Original title' });
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/proof-blocks')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, title: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('unpublishes back to draft', async () => {
    const created = await request(server)
      .post('/api/v1/cms/proof-blocks')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Block' } });

    await request(server)
      .post(`/api/v1/cms/proof-blocks/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const unpublishRes = await request(server)
      .post(`/api/v1/cms/proof-blocks/${created.body.id}/unpublish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(unpublishRes.status).toBe(201);
    expect(unpublishRes.body.status).toBe('draft');
    expect(unpublishRes.body.publishedAt).toBeNull();
  });

  it('reorders a real multi-row content type', async () => {
    const blocks = [];
    for (const title of ['First', 'Second', 'Third']) {
      const res = await request(server)
        .post('/api/v1/cms/proof-blocks')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, title: { en: title } });
      blocks.push(res.body);
    }

    const reversedIds = [blocks[2].id, blocks[1].id, blocks[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/proof-blocks/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/proof-blocks?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const listedIds = listRes.body.data.map((b: any) => b.id);
    expect(listedIds).toEqual(reversedIds);
  });

  it('scopes every read/write by siteId -- a block from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/proof-blocks')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Site A block' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/proof-blocks/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('deletes a block and emits the deletion event without error', async () => {
    const created = await request(server)
      .post('/api/v1/cms/proof-blocks')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, title: { en: 'Doomed block' } });

    const deleteRes = await request(server)
      .delete(`/api/v1/cms/proof-blocks/${created.body.id}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await request(server)
      .get(`/api/v1/cms/proof-blocks/${created.body.id}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(getAfterDelete.status).toBe(404);
  });
});
