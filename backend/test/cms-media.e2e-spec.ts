import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-B.4: POST /cms/media
 *
 * Proves that:
 * 1. school_admin/staff can upload a file for an existing Site and get
 *    back a persisted MediaAsset row (id, siteId, originalFilename,
 *    mimeType, sizeBytes, storageKey, url all populated correctly).
 * 2. The uploaded bytes are actually retrievable from the configured
 *    local storage path (proves the StorageProvider was really called,
 *    not just the DB row created).
 * 3. accountant/teacher/parent are rejected (403) -- CMS_MEDIA_MANAGE is
 *    only granted to school_admin/staff (permissions.ts).
 * 4. A nonexistent siteId 404s instead of silently writing an orphaned
 *    file.
 * 5. A request with no file attached is rejected (400).
 *
 * MEDIA_STORAGE_DRIVER is left unset (defaults to `local`) and
 * MEDIA_LOCAL_PATH points at a per-run temp dir so this spec never
 * touches a real dev `./storage/media` folder or needs S3 credentials.
 */
describe('CMS Media Upload (CMS-B.4 e2e)', () => {
  let app: INestApplication;
  let server: any;
  let mediaTmpDir: string;

  beforeAll(async () => {
    mediaTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-media-e2e-'));
    process.env.MEDIA_STORAGE_DRIVER = 'local';
    process.env.MEDIA_LOCAL_PATH = mediaTmpDir;

    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await closeTestApp(app);
    await fs.rm(mediaTmpDir, { recursive: true, force: true });
    delete process.env.MEDIA_STORAGE_DRIVER;
    delete process.env.MEDIA_LOCAL_PATH;
  });

  let schoolA: Awaited<ReturnType<typeof createSchool>>;
  let schoolAdminA: Awaited<ReturnType<typeof createUser>>;
  let staffA: Awaited<ReturnType<typeof createUser>>;
  let accountantA: Awaited<ReturnType<typeof createUser>>;
  let teacherA: Awaited<ReturnType<typeof createUser>>;
  let parentA: Awaited<ReturnType<typeof createUser>>;
  let site: Awaited<ReturnType<typeof createSite>>;

  beforeEach(async () => {
    await truncateAll(app);

    schoolA = await createSchool(app, { name: 'School A' });
    schoolAdminA = await createUser(app, { role: Role.SCHOOL_ADMIN, schoolId: schoolA.id });
    staffA = await createUser(app, { role: Role.STAFF, schoolId: schoolA.id });
    accountantA = await createUser(app, { role: Role.ACCOUNTANT, schoolId: schoolA.id });
    teacherA = await createUser(app, { role: Role.TEACHER, schoolId: schoolA.id });
    parentA = await createUser(app, { role: Role.PARENT, schoolId: schoolA.id });

    // Site is a CMS-level concept, deliberately unrelated to School (see
    // Site entity doc comment) -- schoolA above only exists here to give
    // the test users a tenant, not because the Site is scoped to it.
    site = await createSite(app);
  });

  describe('POST /cms/media', () => {
    it('lets school_admin upload a file and persists a matching MediaAsset', async () => {
      const res = await request(server)
        .post('/api/v1/cms/media')
        .set('Authorization', authHeader(app, schoolAdminA))
        .field('siteId', site.id)
        .field('altText', 'A test logo')
        .attach('file', Buffer.from('fake-png-bytes'), {
          filename: 'logo.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.siteId).toBe(site.id);
      expect(res.body.originalFilename).toBe('logo.png');
      expect(res.body.mimeType).toBe('image/png');
      expect(res.body.sizeBytes).toBe(Buffer.from('fake-png-bytes').byteLength);
      expect(res.body.altText).toBe('A test logo');
      expect(res.body.uploadedById).toBe(schoolAdminA.id);
      expect(res.body.storageKey).toMatch(new RegExp(`^sites/${site.id}/.+\\.png$`));
      expect(res.body.url).toBe(`/media/${res.body.storageKey}`);

      // Proves the bytes actually landed on the configured storage
      // backend, not just that a DB row was created.
      const writtenBytes = await fs.readFile(path.join(mediaTmpDir, res.body.storageKey));
      expect(writtenBytes.equals(Buffer.from('fake-png-bytes'))).toBe(true);
    });

    it('lets staff upload a file', async () => {
      const res = await request(server)
        .post('/api/v1/cms/media')
        .set('Authorization', authHeader(app, staffA))
        .field('siteId', site.id)
        .attach('file', Buffer.from('staff-upload'), { filename: 'doc.txt', contentType: 'text/plain' });

      expect(res.status).toBe(201);
      expect(res.body.uploadedById).toBe(staffA.id);
    });

    it.each([
      ['accountant', () => accountantA],
      ['teacher', () => teacherA],
      ['parent', () => parentA],
    ])('rejects %s with 403', async (_label, getUser) => {
      const res = await request(server)
        .post('/api/v1/cms/media')
        .set('Authorization', authHeader(app, getUser()))
        .field('siteId', site.id)
        .attach('file', Buffer.from('nope'), { filename: 'nope.txt', contentType: 'text/plain' });

      expect(res.status).toBe(403);
    });

    it('404s for a nonexistent siteId instead of writing an orphaned file', async () => {
      const res = await request(server)
        .post('/api/v1/cms/media')
        .set('Authorization', authHeader(app, schoolAdminA))
        .field('siteId', '00000000-0000-0000-0000-000000000000')
        .attach('file', Buffer.from('orphan'), { filename: 'orphan.txt', contentType: 'text/plain' });

      expect(res.status).toBe(404);
    });

    it('rejects a request with no file attached', async () => {
      const res = await request(server)
        .post('/api/v1/cms/media')
        .set('Authorization', authHeader(app, schoolAdminA))
        .field('siteId', site.id);

      expect(res.status).toBe(400);
    });

    it('rejects an invalid siteId shape', async () => {
      const res = await request(server)
        .post('/api/v1/cms/media')
        .set('Authorization', authHeader(app, schoolAdminA))
        .field('siteId', 'not-a-uuid')
        .attach('file', Buffer.from('bad-id'), { filename: 'bad.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
    });
  });
});
