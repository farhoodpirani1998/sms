import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-H.1: Gallery. First CMS-H content type -- confirms Media
 * (CMS-B.4) + the simple-content pattern (CMS-D) compose correctly, per
 * the roadmap's H.1 handoff note. Mirrors `cms-about.e2e-spec.ts`'s
 * create -> publish -> revision-restore -> reorder -> site-scoping
 * shape, but with a real uploaded `MediaAsset` (via `POST /cms/media`,
 * same as `cms-media.e2e-spec.ts`) standing in for `mediaId`, since
 * `GalleryItem.mediaId` is a required relation, not an optional
 * `coverMediaId` like every CMS-D/F/G type's.
 */
describe('CMS Gallery (CMS-H.1 e2e)', () => {
  let app: INestApplication;
  let server: any;
  let mediaTmpDir: string;

  beforeAll(async () => {
    mediaTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-gallery-e2e-'));
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

    site = await createSite(app, {
      defaultLocale: 'en',
      supportedLocales: ['en', 'fa'],
    } as any);
    otherSite = await createSite(app);
  });

  async function uploadMedia(forSite = site, filename = 'photo.jpg') {
    const res = await request(server)
      .post('/api/v1/cms/media')
      .set('Authorization', authHeader(app, schoolAdmin))
      .field('siteId', forSite.id)
      .attach('file', Buffer.from(`fake-bytes-${filename}`), {
        filename,
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('runs the full create -> edit -> publish -> revision-restore round trip with a real uploaded media reference', async () => {
    const media = await uploadMedia();

    const createRes = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        mediaId: media.id,
        caption: { en: 'Sports day', fa: 'روز ورزش' },
        category: 'sports',
      });

    expect(createRes.status).toBe(201);
    const itemId = createRes.body.id;
    expect(createRes.body.mediaId).toBe(media.id);
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/gallery/${itemId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ caption: { en: 'Edited caption' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.caption).toEqual({ en: 'Edited caption' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/gallery/${itemId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/gallery/${itemId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/gallery/${itemId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.caption).toEqual({ en: 'Sports day', fa: 'روز ورزش' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/gallery/${itemId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.caption).toEqual({ en: 'Sports day', fa: 'روز ورزش' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const media = await uploadMedia();
    const res = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, mediaId: media.id });

    expect(res.status).toBe(403);
  });

  it('requires mediaId on create -- unlike every optional coverMediaId elsewhere in the module', async () => {
    const res = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, caption: { en: 'No media' } });

    expect(res.status).toBe(400);
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const label of ['First', 'Second', 'Third']) {
      const media = await uploadMedia(site, `${label}.jpg`);
      const res = await request(server)
        .post('/api/v1/cms/gallery')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, mediaId: media.id, caption: { en: label } });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/gallery/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/gallery?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((g: any) => g.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a gallery item from another Site 404s', async () => {
    const media = await uploadMedia();
    const created = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, mediaId: media.id });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/gallery/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, localized, resolving the real media URL', async () => {
    const media = await uploadMedia(site, 'sports-day.jpg');

    const draft = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, mediaId: media.id, caption: { en: 'Draft item' } });

    const published = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        mediaId: media.id,
        caption: { en: 'Sports day', fa: 'روز ورزش' },
        category: 'sports',
      });

    await request(server)
      .post(`/api/v1/cms/gallery/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server)
      .get(`/api/v1/public/gallery`)
      .set('Host', site.domain);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].caption).toBe('Sports day');
    expect(publicRes.body[0].mediaUrl).toBe(media.url);
    expect(publicRes.body[0].category).toBe('sports');

    expect(publicRes.body.find((g: any) => g.id === draft.body.id)).toBeUndefined();

    const publicResFa = await request(server)
      .get(`/api/v1/public/gallery?locale=fa`)
      .set('Host', site.domain);
    expect(publicResFa.body[0].caption).toBe('روز ورزش');
  });

  it('filters both admin and public listings by category', async () => {
    const media = await uploadMedia();

    const sports = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, mediaId: media.id, category: 'sports' });
    await request(server)
      .post(`/api/v1/cms/gallery/${sports.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const campusLife = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, mediaId: media.id, category: 'campus-life' });
    await request(server)
      .post(`/api/v1/cms/gallery/${campusLife.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const adminFiltered = await request(server)
      .get(`/api/v1/cms/gallery?siteId=${site.id}&category=sports`)
      .set('Authorization', authHeader(app, schoolAdmin));
    expect(adminFiltered.body.data.map((g: any) => g.id)).toEqual([sports.body.id]);

    const publicFiltered = await request(server)
      .get(`/api/v1/public/gallery?category=campus-life`)
      .set('Host', site.domain);
    expect(publicFiltered.body.map((g: any) => g.id)).toEqual([campusLife.body.id]);
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const media = await uploadMedia();
    const created = await request(server)
      .post('/api/v1/cms/gallery')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, mediaId: media.id });

    await request(server)
      .post(`/api/v1/cms/gallery/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/public/gallery`)
      .set('Host', otherSite.domain);

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
