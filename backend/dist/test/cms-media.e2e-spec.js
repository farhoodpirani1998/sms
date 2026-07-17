"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('CMS Media Upload (CMS-B.4 e2e)', () => {
    let app;
    let server;
    let mediaTmpDir;
    beforeAll(async () => {
        mediaTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-media-e2e-'));
        process.env.MEDIA_STORAGE_DRIVER = 'local';
        process.env.MEDIA_LOCAL_PATH = mediaTmpDir;
        app = await (0, test_app_1.createTestApp)();
        server = app.getHttpServer();
    });
    afterAll(async () => {
        await (0, test_app_1.closeTestApp)(app);
        await fs.rm(mediaTmpDir, { recursive: true, force: true });
        delete process.env.MEDIA_STORAGE_DRIVER;
        delete process.env.MEDIA_LOCAL_PATH;
    });
    let schoolA;
    let schoolAdminA;
    let staffA;
    let accountantA;
    let teacherA;
    let parentA;
    let site;
    beforeEach(async () => {
        await (0, test_app_1.truncateAll)(app);
        schoolA = await (0, factories_1.createSchool)(app, { name: 'School A' });
        schoolAdminA = await (0, factories_1.createUser)(app, { role: factories_1.Role.SCHOOL_ADMIN, schoolId: schoolA.id });
        staffA = await (0, factories_1.createUser)(app, { role: factories_1.Role.STAFF, schoolId: schoolA.id });
        accountantA = await (0, factories_1.createUser)(app, { role: factories_1.Role.ACCOUNTANT, schoolId: schoolA.id });
        teacherA = await (0, factories_1.createUser)(app, { role: factories_1.Role.TEACHER, schoolId: schoolA.id });
        parentA = await (0, factories_1.createUser)(app, { role: factories_1.Role.PARENT, schoolId: schoolA.id });
        site = await (0, factories_1.createSite)(app);
    });
    describe('POST /cms/media', () => {
        it('lets school_admin upload a file and persists a matching MediaAsset', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/media')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA))
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
            const writtenBytes = await fs.readFile(path.join(mediaTmpDir, res.body.storageKey));
            expect(writtenBytes.equals(Buffer.from('fake-png-bytes'))).toBe(true);
        });
        it('lets staff upload a file', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/media')
                .set('Authorization', (0, factories_1.authHeader)(app, staffA))
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
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/media')
                .set('Authorization', (0, factories_1.authHeader)(app, getUser()))
                .field('siteId', site.id)
                .attach('file', Buffer.from('nope'), { filename: 'nope.txt', contentType: 'text/plain' });
            expect(res.status).toBe(403);
        });
        it('404s for a nonexistent siteId instead of writing an orphaned file', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/media')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA))
                .field('siteId', '00000000-0000-0000-0000-000000000000')
                .attach('file', Buffer.from('orphan'), { filename: 'orphan.txt', contentType: 'text/plain' });
            expect(res.status).toBe(404);
        });
        it('rejects a request with no file attached', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/media')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA))
                .field('siteId', site.id);
            expect(res.status).toBe(400);
        });
        it('rejects an invalid siteId shape', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/cms/media')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA))
                .field('siteId', 'not-a-uuid')
                .attach('file', Buffer.from('bad-id'), { filename: 'bad.txt', contentType: 'text/plain' });
            expect(res.status).toBe(400);
        });
    });
});
//# sourceMappingURL=cms-media.e2e-spec.js.map