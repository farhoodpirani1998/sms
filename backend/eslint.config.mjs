// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

/**
 * This config's only enforced rule right now is the CMS/School
 * bounded-context boundary that `docs/architecture/CMS_ARCHITECTURE.md`
 * and dozens of comments across `src/modules/cms/**` already describe
 * as "the import-boundary lint rule". Until this file existed, that
 * boundary was a documented convention only — nothing failed the build
 * if it was violated. `import/no-restricted-paths` below is what
 * actually makes it a gate.
 *
 * WIDENED FROM THE FIRST DRAFT: the architecture doc talks about a
 * single `modules/school/*`, but the real repo has no such folder — the
 * School domain is actually split across ~20 sibling folders
 * (`modules/teacher`, `modules/students`, `modules/schools`,
 * `modules/school-settings`, `modules/academic-years`, `modules/grades`,
 * `modules/attendance`, etc). A rule that only named `teacher`/`school`
 * would silently miss a future `modules/cms` import of, say,
 * `modules/students`. An audit of the current codebase found
 * `modules/cms` importing from **zero** other `src/modules/*` folders —
 * everything it reuses (auth guards, audit, events) comes from
 * `src/common/*`, exactly per the architecture doc. So the accurate,
 * complete rule is simpler than enumerating "School-domain" modules:
 * `modules/cms` may not import from ANY other `src/modules/*` folder,
 * and no other `src/modules/*` folder may import from `modules/cms`.
 * `src/common/*` stays unrestricted in both directions — that's the
 * shared infra layer the doc says CMS should reuse.
 *
 * MAINTENANCE NOTE: `import/no-restricted-paths` has no built-in
 * "everything except X" glob, so the sibling-module list below is
 * enumerated explicitly. Adding a new folder under `src/modules/`
 * means adding its name to `schoolDomainModules` too, or it won't be
 * covered by this rule.
 *
 * Run `npm run lint` to check; `npm run lint:fix` for auto-fixable
 * issues (the boundary violations below are not auto-fixable by design
 * — they need a real refactor, not a codemod).
 */
const schoolDomainModules = [
  'academic-years',
  'analytics',
  'announcements',
  'attendance',
  'auth',
  'grades',
  'health',
  'homework',
  'ledger',
  'notifications',
  'parent',
  'reports',
  'scheduler',
  'school-settings',
  'schools',
  'search',
  'student-assessments',
  'student-documents',
  'students',
  'teacher',
  'timetable',
  'tuition',
  'users',
].map((name) => `./src/modules/${name}`);
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Keep this file's only strict, build-breaking rule focused and
      // legible. Everything else (unused vars, etc.) is left at
      // typescript-eslint's recommended defaults rather than tightened
      // here, so this rule's intent doesn't get lost in unrelated noise.
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/modules/cms',
              from: schoolDomainModules,
              message:
                'Bounded-context violation: modules/cms must not import from any other src/modules/* folder (the School domain, split across ~20 sibling modules). CMS content entities are display-only and deliberately unrelated to School-domain records — see docs/architecture/CMS_ARCHITECTURE.md §1/§7 and TeacherProfile\'s doc comment. Shared infra belongs in src/common/*, which stays unrestricted. Reconcile via admin data entry, not a foreign key or import.',
            },
            {
              target: schoolDomainModules,
              from: './src/modules/cms',
              message:
                'Bounded-context violation: no other src/modules/* folder may import from modules/cms. The boundary documented in docs/architecture/CMS_ARCHITECTURE.md is bidirectional.',
            },
          ],
        },
      ],
    },
  },
);
