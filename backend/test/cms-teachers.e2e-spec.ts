import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-H.3: Teachers (`TeacherProfile`). Copies `Testimonial`'s
 * (CMS-H.2)/`GalleryItem`'s (CMS-H.1) shape. Also proves the entity's
 * bounded-context note holds at the API level: this module exposes no
 * route that touches the School-domain `Teacher` (`modules/teacher`) --
 * a `TeacherProfile` is created from a bare `name` string with no
 * relation to any School-domain staff record.
 */
describe('CMS Teachers (CMS-H.3 e2e)', () => {
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

    site = await createSite(app, {
      defaultLocale: 'en',
      supportedLocales: ['en', 'fa'],
    } as any);
    otherSite = await createSite(app);
  });

  it('runs the full create -> edit -> publish -> revision-restore round trip', async () => {
    const createRes = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        name: 'Ms. Rahimi',
        role: { en: 'Grade 3 Homeroom Teacher', fa: 'معلم پایه سوم' },
        bio: { en: 'Original bio' },
      });

    expect(createRes.status).toBe(201);
    const teacherId = createRes.body.id;
    expect(createRes.body.name).toBe('Ms. Rahimi');
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/teachers/${teacherId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ bio: { en: 'Edited bio' } });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.bio).toEqual({ en: 'Edited bio' });

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/teachers/${teacherId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/teachers/${teacherId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/teachers/${teacherId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.bio).toEqual({ en: 'Original bio' });

    const restoreRes = await request(server)
      .post(`/api/v1/cms/teachers/${teacherId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.bio).toEqual({ en: 'Original bio' });
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, name: 'Nobody' });

    expect(res.status).toBe(403);
  });

  it('requires a name but no relation to any School-domain staff record', async () => {
    const missingName = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, role: { en: 'Guest instructor' } });
    expect(missingName.status).toBe(400);

    // A name with no corresponding User/Teacher record at all is valid --
    // TeacherProfile is a CMS-owned display entity, not an FK to
    // modules/teacher (see the entity's bounded-context note).
    const guestInstructor = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, name: 'Visiting Guest Instructor' });
    expect(guestInstructor.status).toBe(201);
    expect(guestInstructor.body.name).toBe('Visiting Guest Instructor');
  });

  it('reorders a real multi-row content type', async () => {
    const items = [];
    for (const name of ['Teacher One', 'Teacher Two', 'Teacher Three']) {
      const res = await request(server)
        .post('/api/v1/cms/teachers')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, name });
      items.push(res.body);
    }

    const reversedIds = [items[2].id, items[1].id, items[0].id];

    const reorderRes = await request(server)
      .post('/api/v1/cms/teachers/reorder')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, orderedIds: reversedIds });

    expect(reorderRes.status).toBe(201);

    const listRes = await request(server)
      .get(`/api/v1/cms/teachers?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(listRes.body.data.map((t: any) => t.id)).toEqual(reversedIds);
  });

  it('scopes admin reads by siteId -- a teacher profile from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, name: 'Site A Teacher' });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/teachers/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  it('public endpoint returns only published rows, ordered, with no auth required', async () => {
    const draft = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, name: 'Draft Teacher' });

    const published = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({
        siteId: site.id,
        name: 'Published Teacher',
        role: { en: 'Grade 3 Homeroom Teacher', fa: 'معلم پایه سوم' },
        bio: { en: 'English bio' },
      });

    await request(server)
      .post(`/api/v1/cms/teachers/${published.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const publicRes = await request(server)
      .get(`/api/v1/cms/public/teachers`)
      .set('Host', site.domain);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveLength(1);
    expect(publicRes.body[0].id).toBe(published.body.id);
    expect(publicRes.body[0].name).toBe('Published Teacher');
    expect(publicRes.body[0].role).toBe('Grade 3 Homeroom Teacher');
    expect(publicRes.body[0].photoUrl).toBeNull();
    expect(publicRes.body[0].status).toBeUndefined();

    expect(publicRes.body.find((t: any) => t.id === draft.body.id)).toBeUndefined();

    const publicResFa = await request(server)
      .get(`/api/v1/cms/public/teachers?locale=fa`)
      .set('Host', site.domain);
    expect(publicResFa.body[0].role).toBe('معلم پایه سوم');
    expect(publicResFa.body[0].bio).toBe('English bio');
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/teachers')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, name: 'Site A Teacher' });

    await request(server)
      .post(`/api/v1/cms/teachers/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/cms/public/teachers`)
      .set('Host', otherSite.domain);

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toHaveLength(0);
  });
});
