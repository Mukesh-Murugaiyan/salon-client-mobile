import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hasPermission, can } from '../src/utils/permission.ts';

describe('Dynamic Permission Utility Tests', () => {
  it('correctly matches exact permission strings', () => {
    const permissions = ['attendance:check_in', 'appointments:view', 'dashboard:view'];
    assert.strictEqual(hasPermission(permissions, 'attendance:check_in'), true);
    assert.strictEqual(hasPermission(permissions, 'appointments:view'), true);
    assert.strictEqual(hasPermission(permissions, 'dashboard:view'), true);
  });

  it('rejects permissions not present in the user permissions array', () => {
    const permissions = ['appointments:view', 'clients:view'];
    assert.strictEqual(hasPermission(permissions, 'attendance:check_in'), false);
    assert.strictEqual(hasPermission(permissions, 'attendance:view'), false);
    assert.strictEqual(hasPermission(permissions, 'subscription:view'), false);
  });

  it('handles case-insensitivity seamlessly', () => {
    const permissions = ['ATTENDANCE:CHECK_IN', 'Appointments:View'];
    assert.strictEqual(hasPermission(permissions, 'attendance:check_in'), true);
    assert.strictEqual(hasPermission(permissions, 'appointments:view'), true);
    assert.strictEqual(can(permissions, 'attendance', 'check_in'), true);
  });

  it('supports module wildcards (e.g. attendance:*)', () => {
    const permissions = ['attendance:*', 'clients:view'];
    assert.strictEqual(hasPermission(permissions, 'attendance:check_in'), true);
    assert.strictEqual(hasPermission(permissions, 'attendance:view'), true);
    assert.strictEqual(hasPermission(permissions, 'appointments:view'), false);
  });

  it('supports global super wildcard (*)', () => {
    const permissions = ['*'];
    assert.strictEqual(hasPermission(permissions, 'attendance:check_in'), true);
    assert.strictEqual(hasPermission(permissions, 'appointments:view'), true);
    assert.strictEqual(hasPermission(permissions, 'subscription:view'), true);
  });

  it('ensures SUPER_ADMIN without attendance permissions does not see attendance', () => {
    // Super admin role permissions from database
    const superAdminPermissions = [
      'users:view', 'users:create', 'users:update', 'users:delete',
      'roles:view', 'roles:create', 'roles:update', 'roles:delete',
      'subscription:view', 'subscription:assign', 'subscription:renew',
      'salons:view', 'salons:create', 'salons:update',
      'plans:view', 'plans:create', 'plans:update', 'plans:delete'
    ];

    // SUPER_ADMIN has subscription:view
    assert.strictEqual(can(superAdminPermissions, 'subscription', 'view'), true);

    // SUPER_ADMIN does NOT have attendance:check_in or appointments:view
    assert.strictEqual(can(superAdminPermissions, 'attendance', 'check_in'), false);
    assert.strictEqual(can(superAdminPermissions, 'attendance', 'view'), false);
    assert.strictEqual(can(superAdminPermissions, 'appointments', 'view'), false);
  });

  it('safely handles null, undefined, or empty permissions without throwing', () => {
    assert.strictEqual(hasPermission(null, 'attendance:check_in'), false);
    assert.strictEqual(hasPermission(undefined, 'attendance:check_in'), false);
    assert.strictEqual(hasPermission([], 'attendance:check_in'), false);
    assert.strictEqual(can(null, 'attendance', 'check_in'), false);
    assert.strictEqual(can(undefined, 'attendance', 'check_in'), false);
  });
});
