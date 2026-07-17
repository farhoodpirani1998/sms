"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permissions_1 = require("./permissions");
const roles_enum_1 = require("./roles.enum");
describe('roleHasPermission', () => {
    it('grants super_admin every permission, even ones not listed in the map', () => {
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SUPER_ADMIN, permissions_1.Permission.PAYMENT_VOID)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SUPER_ADMIN, permissions_1.Permission.DISCOUNT_UNLIMITED)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SUPER_ADMIN, permissions_1.Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(true);
    });
    it('grants school_admin PAYMENT_VOID, DISCOUNT_UNLIMITED, and INSTALLMENT_STATUS_OVERRIDE', () => {
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.PAYMENT_VOID)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.DISCOUNT_UNLIMITED)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(true);
    });
    it('denies accountant every fine-grained permission', () => {
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.ACCOUNTANT, permissions_1.Permission.PAYMENT_VOID)).toBe(false);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.ACCOUNTANT, permissions_1.Permission.DISCOUNT_UNLIMITED)).toBe(false);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.ACCOUNTANT, permissions_1.Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(false);
    });
    it('denies staff every fine-grained permission', () => {
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.PAYMENT_VOID)).toBe(false);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.DISCOUNT_UNLIMITED)).toBe(false);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(false);
    });
    it('denies an unrecognized role string rather than throwing', () => {
        expect((0, permissions_1.roleHasPermission)('some_made_up_role', permissions_1.Permission.PAYMENT_VOID)).toBe(false);
    });
    it('grants school_admin all four CMS permissions', () => {
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.CMS_CONTENT_EDIT)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.CMS_CONTENT_PUBLISH)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.CMS_MEDIA_MANAGE)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.SCHOOL_ADMIN, permissions_1.Permission.CMS_SITE_MANAGE)).toBe(true);
    });
    it('grants staff CMS_CONTENT_EDIT and CMS_MEDIA_MANAGE but not publish or site management', () => {
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.CMS_CONTENT_EDIT)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.CMS_MEDIA_MANAGE)).toBe(true);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.CMS_CONTENT_PUBLISH)).toBe(false);
        expect((0, permissions_1.roleHasPermission)(roles_enum_1.Role.STAFF, permissions_1.Permission.CMS_SITE_MANAGE)).toBe(false);
    });
    it('denies accountant, parent, and teacher every CMS permission', () => {
        for (const role of [roles_enum_1.Role.ACCOUNTANT, roles_enum_1.Role.PARENT, roles_enum_1.Role.TEACHER]) {
            expect((0, permissions_1.roleHasPermission)(role, permissions_1.Permission.CMS_CONTENT_EDIT)).toBe(false);
            expect((0, permissions_1.roleHasPermission)(role, permissions_1.Permission.CMS_CONTENT_PUBLISH)).toBe(false);
            expect((0, permissions_1.roleHasPermission)(role, permissions_1.Permission.CMS_MEDIA_MANAGE)).toBe(false);
            expect((0, permissions_1.roleHasPermission)(role, permissions_1.Permission.CMS_SITE_MANAGE)).toBe(false);
        }
    });
});
describe('DISCOUNT_CEILING_RATIO', () => {
    it('caps accountant discounts at 10% of baseAmount', () => {
        expect(permissions_1.DISCOUNT_CEILING_RATIO[roles_enum_1.Role.ACCOUNTANT]).toBe(0.1);
    });
    it('gives staff a 0% ceiling (any discount needs escalation)', () => {
        expect(permissions_1.DISCOUNT_CEILING_RATIO[roles_enum_1.Role.STAFF]).toBe(0);
    });
});
//# sourceMappingURL=permissions.spec.js.map