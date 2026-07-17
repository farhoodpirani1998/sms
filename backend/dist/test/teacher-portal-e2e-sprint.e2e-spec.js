"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_app_1 = require("./setup/test-app");
const factories_1 = require("./setup/factories");
describe('Teacher Portal — E2E Sprint', () => {
    let app;
    let server;
    let schoolA;
    let schoolAdminA;
    let teacherA;
    let acadYearA;
    let gradeA1;
    let subjectA1;
    let studentA1;
    beforeAll(async () => {
        app = await (0, test_app_1.createTestApp)();
        server = app.getHttpServer();
    });
    afterAll(async () => {
        await (0, test_app_1.closeTestApp)(app);
    });
    beforeEach(async () => {
        await (0, test_app_1.truncateAll)(app);
        schoolA = await (0, factories_1.createSchool)(app, { name: 'School A' });
        schoolAdminA = await (0, factories_1.createUser)(app, { role: factories_1.Role.SCHOOL_ADMIN, schoolId: schoolA.id });
        teacherA = await (0, factories_1.createUser)(app, { role: factories_1.Role.TEACHER, schoolId: schoolA.id, fullName: 'Teacher A' });
        acadYearA = await (0, factories_1.createAcademicYear)(app, schoolA.id);
        gradeA1 = await (0, factories_1.createGrade)(app, schoolA.id, { title: 'Grade 7' });
        subjectA1 = await (0, factories_1.createSubject)(app, schoolA.id, { title: 'Math' });
        studentA1 = await (0, factories_1.createStudent)(app, schoolA.id, {
            academicYearId: acadYearA.id,
            gradeId: gradeA1.id,
            fullName: 'Student A1',
        });
    });
    describe('Authentication', () => {
        it('lets a teacher log in with valid credentials', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: teacherA.phone, password: factories_1.TEST_PASSWORD });
            expect(res.status).toBe(200);
            expect(res.body.accessToken).toEqual(expect.any(String));
            expect(res.body.user.id).toBe(teacherA.id);
            expect(res.body.user.role).toBe('teacher');
            expect(res.body.user.passwordHash).toBeUndefined();
        });
        it('rejects an invalid password with the same message as an unknown phone (no user enumeration)', async () => {
            const wrongPassword = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: teacherA.phone, password: 'TotallyWrongPassw0rd!' });
            const unknownPhone = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: '+989000000000', password: factories_1.TEST_PASSWORD });
            expect(wrongPassword.status).toBe(401);
            expect(unknownPhone.status).toBe(401);
            expect(wrongPassword.body.message).toBe(unknownPhone.body.message);
        });
        it('rejects a malformed login payload (password below minimum length)', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: teacherA.phone, password: '123' });
            expect(res.status).toBe(400);
        });
        it('rejects an inactive teacher account at login', async () => {
            const inactive = await (0, factories_1.createUser)(app, { role: factories_1.Role.TEACHER, schoolId: schoolA.id, isActive: false });
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: inactive.phone, password: factories_1.TEST_PASSWORD });
            expect(res.status).toBe(401);
        });
        it('rejects every /teacher/* route without a token (protected routes)', async () => {
            const routes = ['/api/v1/teacher/profile', '/api/v1/teacher/classes', '/api/v1/teacher/subjects'];
            for (const route of routes) {
                const res = await (0, supertest_1.default)(server).get(route);
                expect(res.status).toBe(401);
            }
        });
        it('rejects a garbage/invalid bearer token', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/profile')
                .set('Authorization', 'Bearer not-a-real-jwt');
            expect(res.status).toBe(401);
        });
        it('rejects a well-formed token for a role the route does not allow (role guard)', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/profile')
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA));
            expect(res.status).toBe(403);
        });
        it("login response's user.role lets the frontend route each persona to its own portal", async () => {
            const teacherLogin = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: teacherA.phone, password: factories_1.TEST_PASSWORD });
            const adminLogin = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ phone: schoolAdminA.phone, password: factories_1.TEST_PASSWORD });
            expect(teacherLogin.body.user.role).toBe('teacher');
            expect(adminLogin.body.user.role).toBe('school_admin');
        });
    });
    describe('Teacher Dashboard', () => {
        it('success: a teacher with assignments gets consistent profile/classes/subjects', async () => {
            await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
            });
            const [profile, classes, subjects] = await Promise.all([
                (0, supertest_1.default)(server).get('/api/v1/teacher/profile').set('Authorization', (0, factories_1.authHeader)(app, teacherA)),
                (0, supertest_1.default)(server).get('/api/v1/teacher/classes').set('Authorization', (0, factories_1.authHeader)(app, teacherA)),
                (0, supertest_1.default)(server).get('/api/v1/teacher/subjects').set('Authorization', (0, factories_1.authHeader)(app, teacherA)),
            ]);
            expect(profile.status).toBe(200);
            expect(classes.status).toBe(200);
            expect(subjects.status).toBe(200);
            expect(profile.body.assignments).toHaveLength(1);
            expect(classes.body.map((c) => c.title)).toEqual(['Grade 7']);
            expect(subjects.body.map((s) => s.title)).toEqual(['Math']);
        });
        it('empty state: a freshly-created teacher with no assignments gets empty arrays, not an error', async () => {
            const freshTeacher = await (0, factories_1.createUser)(app, { role: factories_1.Role.TEACHER, schoolId: schoolA.id });
            const [profile, classes, subjects] = await Promise.all([
                (0, supertest_1.default)(server).get('/api/v1/teacher/profile').set('Authorization', (0, factories_1.authHeader)(app, freshTeacher)),
                (0, supertest_1.default)(server).get('/api/v1/teacher/classes').set('Authorization', (0, factories_1.authHeader)(app, freshTeacher)),
                (0, supertest_1.default)(server).get('/api/v1/teacher/subjects').set('Authorization', (0, factories_1.authHeader)(app, freshTeacher)),
            ]);
            expect(profile.status).toBe(200);
            expect(profile.body.assignments).toEqual([]);
            expect(classes.status).toBe(200);
            expect(classes.body).toEqual([]);
            expect(subjects.status).toBe(200);
            expect(subjects.body).toEqual([]);
        });
        it('error state: every dashboard request 401s cleanly without a token (what the frontend Retry surface reacts to)', async () => {
            const [profile, classes, subjects] = await Promise.all([
                (0, supertest_1.default)(server).get('/api/v1/teacher/profile'),
                (0, supertest_1.default)(server).get('/api/v1/teacher/classes'),
                (0, supertest_1.default)(server).get('/api/v1/teacher/subjects'),
            ]);
            expect(profile.status).toBe(401);
            expect(classes.status).toBe(401);
            expect(subjects.status).toBe(401);
        });
    });
    describe('GET /teacher/students — validation', () => {
        it('rejects a malformed gradeId with 400 (validation), not 403 (authorization)', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/students')
                .query({ gradeId: 'not-a-uuid' })
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(res.status).toBe(400);
        });
    });
    describe('POST /teacher/attendance — error handling', () => {
        beforeEach(async () => {
            await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
            });
        });
        it('404s a nonexistent studentId', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/teacher/attendance')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({ studentId: '00000000-0000-0000-0000-000000000000', date: '2026-07-01', status: 'present' });
            expect(res.status).toBe(404);
        });
        it('rejects a missing required field (date)', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/teacher/attendance')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({ studentId: studentA1.id, status: 'present' });
            expect(res.status).toBe(400);
        });
    });
    describe('POST /teacher/assessments — error handling', () => {
        beforeEach(async () => {
            await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
            });
        });
        it('404s a nonexistent studentId', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/teacher/assessments')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({
                studentId: '00000000-0000-0000-0000-000000000000',
                subjectId: subjectA1.id,
                term: 'first_term',
                score: 18,
            });
            expect(res.status).toBe(404);
        });
        it('rejects a missing required field (score)', async () => {
            const res = await (0, supertest_1.default)(server)
                .post('/api/v1/teacher/assessments')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({ studentId: studentA1.id, subjectId: subjectA1.id, term: 'first_term' });
            expect(res.status).toBe(400);
        });
    });
    describe('GET /teacher/homework — filters', () => {
        let gradeA2;
        let subjectA2;
        beforeEach(async () => {
            gradeA2 = await (0, factories_1.createGrade)(app, schoolA.id, { title: 'Grade 8' });
            subjectA2 = await (0, factories_1.createSubject)(app, schoolA.id, { title: 'Science' });
            await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
            });
            await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA2.id,
                subjectId: subjectA2.id,
            });
            await (0, factories_1.createHomework)(app, {
                schoolId: schoolA.id,
                academicYearId: acadYearA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
                teacherId: teacherA.id,
                title: 'Math homework',
            });
            await (0, factories_1.createHomework)(app, {
                schoolId: schoolA.id,
                academicYearId: acadYearA.id,
                gradeId: gradeA2.id,
                subjectId: subjectA2.id,
                teacherId: teacherA.id,
                title: 'Science homework',
            });
        });
        it('filters by subjectId alone', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/homework')
                .query({ subjectId: subjectA2.id })
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(res.status).toBe(200);
            expect(res.body.map((h) => h.title)).toEqual(['Science homework']);
        });
        it('filters by gradeId and subjectId together', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/homework')
                .query({ gradeId: gradeA1.id, subjectId: subjectA1.id })
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(res.status).toBe(200);
            expect(res.body.map((h) => h.title)).toEqual(['Math homework']);
        });
        it('a mismatched grade+subject combination returns an empty list, not an error', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/homework')
                .query({ gradeId: gradeA1.id, subjectId: subjectA2.id })
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
        it("every returned row carries academicYearId, independent of which grade/subject filter is applied (what the frontend's academic-year picker relies on)", async () => {
            const unfiltered = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/homework')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            const filtered = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/homework')
                .query({ gradeId: gradeA1.id })
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(unfiltered.body.every((h) => h.academicYearId === acadYearA.id)).toBe(true);
            expect(filtered.body.every((h) => h.academicYearId === acadYearA.id)).toBe(true);
            expect(unfiltered.body.length).toBeGreaterThanOrEqual(filtered.body.length);
        });
    });
    describe('Homework — assignment fallback (survives assignment removal)', () => {
        it('a homework row remains fully readable, with its original grade/subject intact, after the underlying assignment is removed', async () => {
            const assignment = await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
            });
            const created = await (0, supertest_1.default)(server)
                .post('/api/v1/teacher/homework')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({
                academicYearId: acadYearA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
                title: 'Orphaned homework',
                description: 'Still valid even after the assignment is gone.',
                dueDate: '2026-12-15',
            });
            expect(created.status).toBe(201);
            const removed = await (0, supertest_1.default)(server)
                .delete(`/api/v1/teacher/assignments/${assignment.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA));
            expect(removed.status).toBe(204);
            const list = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/homework')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(list.status).toBe(200);
            const orphan = list.body.find((h) => h.id === created.body.id);
            expect(orphan).toBeDefined();
            expect(orphan.gradeId).toBe(gradeA1.id);
            expect(orphan.subjectId).toBe(subjectA1.id);
            expect(orphan.gradeTitle).toBe('Grade 7');
            expect(orphan.subjectTitle).toBe('Math');
            const del = await (0, supertest_1.default)(server)
                .delete(`/api/v1/teacher/homework/${created.body.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(del.status).toBe(204);
        });
        it('editing an orphaned row back onto the same (now-unassigned) grade/subject is rejected (intentional — assignment is re-validated on every write)', async () => {
            const assignment = await (0, factories_1.createTeacherAssignment)(app, {
                schoolId: schoolA.id,
                teacherId: teacherA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
            });
            const created = await (0, supertest_1.default)(server)
                .post('/api/v1/teacher/homework')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({
                academicYearId: acadYearA.id,
                gradeId: gradeA1.id,
                subjectId: subjectA1.id,
                title: 'Orphaned homework',
                description: 'Editable only while the assignment still exists.',
                dueDate: '2026-12-15',
            });
            await (0, supertest_1.default)(server)
                .delete(`/api/v1/teacher/assignments/${assignment.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, schoolAdminA));
            const res = await (0, supertest_1.default)(server)
                .put(`/api/v1/teacher/homework/${created.body.id}`)
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA))
                .send({ title: 'Corrected title' });
            expect(res.status).toBe(403);
        });
    });
    describe('GET /teacher/timetable — empty state and retry', () => {
        it('returns an empty list (not an error) for a teacher with no scheduled periods', async () => {
            const res = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/timetable')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
        it('rejects an unauthenticated request', async () => {
            const res = await (0, supertest_1.default)(server).get('/api/v1/teacher/timetable');
            expect(res.status).toBe(401);
        });
        it('is idempotent across repeated calls (what a frontend Retry button relies on)', async () => {
            const first = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/timetable')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            const second = await (0, supertest_1.default)(server)
                .get('/api/v1/teacher/timetable')
                .set('Authorization', (0, factories_1.authHeader)(app, teacherA));
            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(second.body).toEqual(first.body);
        });
    });
});
//# sourceMappingURL=teacher-portal-e2e-sprint.e2e-spec.js.map