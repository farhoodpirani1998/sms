import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, truncateAll } from './setup/test-app';
import { createSchool, createUser, createSite, authHeader, Role } from './setup/factories';

/**
 * CMS-E.2: Navigation — the self-referencing menu tree. Same create/
 * edit/publish/revision-restore shape every other content e2e spec
 * exercises for a single row, plus the two things unique to this type
 * that the roadmap calls out: building a 2-level tree and reading it
 * back correctly nested/ordered via the public endpoint, and per-parent
 * `reorder()` (top-level items and one parent's children are
 * independent sibling groups, unlike every flat list type's single
 * Site-wide order). `reparent()` (moving a row to a different parent)
 * has no equivalent in any other CMS-D/E type, so it gets its own case
 * too.
 */
describe('CMS Navigation (CMS-E.2 e2e)', () => {
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

  it('runs the full create -> edit -> publish -> revision-restore round trip on a top-level item', async () => {
    const createRes = await request(server)
      .post('/api/v1/cms/navigation')
      .set('Authorization', authHeader(app, staff))
      .send({
        siteId: site.id,
        label: { en: 'Admissions', fa: 'ثبت‌نام' },
        url: '/admissions',
      });

    expect(createRes.status).toBe(201);
    const itemId = createRes.body.id;
    expect(createRes.body.siteId).toBe(site.id);
    expect(createRes.body.parentId).toBeNull();
    expect(createRes.body.status).toBe('draft');

    const updateRes = await request(server)
      .patch(`/api/v1/cms/navigation/${itemId}?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff))
      .send({ url: '/admissions/apply' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.url).toBe('/admissions/apply');

    const staffPublishAttempt = await request(server)
      .post(`/api/v1/cms/navigation/${itemId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, staff));
    expect(staffPublishAttempt.status).toBe(403);

    const publishRes = await request(server)
      .post(`/api/v1/cms/navigation/${itemId}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.status).toBe('published');
    expect(publishRes.body.publishedAt).toBeDefined();

    const revisionsRes = await request(server)
      .get(`/api/v1/cms/navigation/${itemId}/revisions`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body.length).toBe(3);

    const originalRevision = revisionsRes.body[revisionsRes.body.length - 1];
    expect(originalRevision.snapshot.url).toBe('/admissions');

    const restoreRes = await request(server)
      .post(`/api/v1/cms/navigation/${itemId}/restore?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ revisionId: originalRevision.id });

    expect(restoreRes.status).toBe(201);
    expect(restoreRes.body.url).toBe('/admissions');
    expect(restoreRes.body.status).toBe('published');
  });

  it('rejects accountant (no CMS permissions at all)', async () => {
    const res = await request(server)
      .post('/api/v1/cms/navigation')
      .set('Authorization', authHeader(app, accountant))
      .send({ siteId: site.id, label: { en: 'Nope' } });

    expect(res.status).toBe(403);
  });

  it('scopes admin reads by siteId -- a navigation item from another Site 404s', async () => {
    const created = await request(server)
      .post('/api/v1/cms/navigation')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, label: { en: 'Site A item' } });

    const crossSiteGet = await request(server)
      .get(`/api/v1/cms/navigation/${created.body.id}?siteId=${otherSite.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    expect(crossSiteGet.status).toBe(404);
  });

  describe('2-level tree assembly + per-parent ordering (CMS-E.2)', () => {
    async function createItem(
      label: string,
      opts: { parentId?: string; url?: string } = {},
    ) {
      const res = await request(server)
        .post('/api/v1/cms/navigation')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, label: { en: label }, ...opts });
      return res.body;
    }

    async function publish(id: string) {
      await request(server)
        .post(`/api/v1/cms/navigation/${id}/publish?siteId=${site.id}`)
        .set('Authorization', authHeader(app, schoolAdmin));
    }

    it('builds a correctly nested, correctly ordered 2-level tree via the public endpoint', async () => {
      const about = await createItem('About', { url: '/about' });
      const programs = await createItem('Programs', { url: '/programs' });
      const contact = await createItem('Contact', { url: '/contact' });

      const elementary = await createItem('Elementary', {
        parentId: programs.id,
        url: '/programs/elementary',
      });
      const highSchool = await createItem('High School', {
        parentId: programs.id,
        url: '/programs/high-school',
      });

      for (const item of [about, programs, contact, elementary, highSchool]) {
        await publish(item.id);
      }

      // Top-level order as created: About, Programs, Contact.
      const reorderTopLevel = await request(server)
        .post('/api/v1/cms/navigation/reorder')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, orderedIds: [programs.id, about.id, contact.id] });
      expect(reorderTopLevel.status).toBe(201);

      // Children order as created: Elementary, High School -- flip them.
      const reorderChildren = await request(server)
        .post('/api/v1/cms/navigation/reorder')
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({
          siteId: site.id,
          parentId: programs.id,
          orderedIds: [highSchool.id, elementary.id],
        });
      expect(reorderChildren.status).toBe(201);

      const publicRes = await request(server)
        .get(`/api/v1/cms/public/navigation`)
        .set('Host', site.domain);

      expect(publicRes.status).toBe(200);
      expect(publicRes.body).toHaveLength(3);
      expect(publicRes.body.map((n: any) => n.label)).toEqual(['Programs', 'About', 'Contact']);

      const programsNode = publicRes.body.find((n: any) => n.label === 'Programs');
      expect(programsNode.children).toHaveLength(2);
      expect(programsNode.children.map((c: any) => c.label)).toEqual(['High School', 'Elementary']);
      expect(programsNode.children[0].url).toBe('/programs/high-school');

      // Leaf nodes (and every non-parent) have an empty children array.
      const aboutNode = publicRes.body.find((n: any) => n.label === 'About');
      expect(aboutNode.children).toEqual([]);
      expect(programsNode.children[0].children).toEqual([]);
    });

    it('rejects a reorder that mixes ids from different parent scopes', async () => {
      const programs = await createItem('Programs');
      const contact = await createItem('Contact');
      const elementary = await createItem('Elementary', { parentId: programs.id });

      const res = await request(server)
        .post('/api/v1/cms/navigation/reorder')
        .set('Authorization', authHeader(app, schoolAdmin))
        // `contact` is top-level, `elementary` is a child of `programs` --
        // not a valid single sibling group under either scope.
        .send({ siteId: site.id, parentId: programs.id, orderedIds: [elementary.id, contact.id] });

      expect(res.status).toBe(400);
    });

    it('reparents an item to a new parent, and rejects moving an item under its own descendant', async () => {
      const programs = await createItem('Programs');
      const admissions = await createItem('Admissions');
      const elementary = await createItem('Elementary', { parentId: programs.id });

      const reparentRes = await request(server)
        .post(`/api/v1/cms/navigation/${admissions.id}/reparent`)
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, parentId: programs.id });

      expect(reparentRes.status).toBe(201);
      expect(reparentRes.body.parentId).toBe(programs.id);

      const cycleRes = await request(server)
        .post(`/api/v1/cms/navigation/${programs.id}/reparent`)
        .set('Authorization', authHeader(app, schoolAdmin))
        .send({ siteId: site.id, parentId: elementary.id });

      expect(cycleRes.status).toBe(400);
    });
  });

  it('public endpoint scopes by siteId -- another Site never sees these items', async () => {
    const created = await request(server)
      .post('/api/v1/cms/navigation')
      .set('Authorization', authHeader(app, schoolAdmin))
      .send({ siteId: site.id, label: { en: 'Site A item' } });

    await request(server)
      .post(`/api/v1/cms/navigation/${created.body.id}/publish?siteId=${site.id}`)
      .set('Authorization', authHeader(app, schoolAdmin));

    const otherSitePublicRes = await request(server)
      .get(`/api/v1/cms/public/navigation`)
      .set('Host', otherSite.domain);

    expect(otherSitePublicRes.status).toBe(200);
    expect(otherSitePublicRes.body).toEqual([]);
  });
});
