import { DISCOUNT_CEILING_RATIO, Permission, roleHasPermission } from './permissions';
import { Role } from './roles.enum';

describe('roleHasPermission', () => {
  it('grants super_admin every permission, even ones not listed in the map', () => {
    expect(roleHasPermission(Role.SUPER_ADMIN, Permission.PAYMENT_VOID)).toBe(true);
    expect(roleHasPermission(Role.SUPER_ADMIN, Permission.DISCOUNT_UNLIMITED)).toBe(true);
    expect(roleHasPermission(Role.SUPER_ADMIN, Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(true);
  });

  it('grants school_admin PAYMENT_VOID, DISCOUNT_UNLIMITED, and INSTALLMENT_STATUS_OVERRIDE', () => {
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.PAYMENT_VOID)).toBe(true);
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.DISCOUNT_UNLIMITED)).toBe(true);
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(true);
  });

  it('denies accountant every fine-grained permission', () => {
    expect(roleHasPermission(Role.ACCOUNTANT, Permission.PAYMENT_VOID)).toBe(false);
    expect(roleHasPermission(Role.ACCOUNTANT, Permission.DISCOUNT_UNLIMITED)).toBe(false);
    expect(roleHasPermission(Role.ACCOUNTANT, Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(false);
  });

  it('denies staff every fine-grained permission', () => {
    expect(roleHasPermission(Role.STAFF, Permission.PAYMENT_VOID)).toBe(false);
    expect(roleHasPermission(Role.STAFF, Permission.DISCOUNT_UNLIMITED)).toBe(false);
    expect(roleHasPermission(Role.STAFF, Permission.INSTALLMENT_STATUS_OVERRIDE)).toBe(false);
  });

  it('denies an unrecognized role string rather than throwing', () => {
    expect(roleHasPermission('some_made_up_role', Permission.PAYMENT_VOID)).toBe(false);
  });

  it('grants school_admin all four CMS permissions', () => {
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.CMS_CONTENT_EDIT)).toBe(true);
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.CMS_CONTENT_PUBLISH)).toBe(true);
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.CMS_MEDIA_MANAGE)).toBe(true);
    expect(roleHasPermission(Role.SCHOOL_ADMIN, Permission.CMS_SITE_MANAGE)).toBe(true);
  });

  it('grants staff CMS_CONTENT_EDIT and CMS_MEDIA_MANAGE but not publish or site management', () => {
    expect(roleHasPermission(Role.STAFF, Permission.CMS_CONTENT_EDIT)).toBe(true);
    expect(roleHasPermission(Role.STAFF, Permission.CMS_MEDIA_MANAGE)).toBe(true);
    expect(roleHasPermission(Role.STAFF, Permission.CMS_CONTENT_PUBLISH)).toBe(false);
    expect(roleHasPermission(Role.STAFF, Permission.CMS_SITE_MANAGE)).toBe(false);
  });

  it('denies accountant, parent, and teacher every CMS permission', () => {
    for (const role of [Role.ACCOUNTANT, Role.PARENT, Role.TEACHER]) {
      expect(roleHasPermission(role, Permission.CMS_CONTENT_EDIT)).toBe(false);
      expect(roleHasPermission(role, Permission.CMS_CONTENT_PUBLISH)).toBe(false);
      expect(roleHasPermission(role, Permission.CMS_MEDIA_MANAGE)).toBe(false);
      expect(roleHasPermission(role, Permission.CMS_SITE_MANAGE)).toBe(false);
    }
  });
});

describe('DISCOUNT_CEILING_RATIO', () => {
  it('caps accountant discounts at 10% of baseAmount', () => {
    expect(DISCOUNT_CEILING_RATIO[Role.ACCOUNTANT]).toBe(0.1);
  });

  it('gives staff a 0% ceiling (any discount needs escalation)', () => {
    expect(DISCOUNT_CEILING_RATIO[Role.STAFF]).toBe(0);
  });
});
