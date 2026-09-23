/**
 * Dynamic Permission Utilities for Mobile Client
 * ZERO hardcoded roles. 100% database-driven permissions.
 */

/**
 * Checks if a permissions array grants access to a specific permission.
 * Supports exact match ('module:action'), module wildcard ('module:*'), or super wildcard ('*').
 *
 * @param permissions Array of permission strings (e.g. ['attendance:check_in', 'appointments:view'])
 * @param requiredPermission Target permission string (e.g. 'attendance:check_in')
 * @returns boolean
 */
export const hasPermission = (
  permissions: string[] | undefined | null,
  requiredPermission: string
): boolean => {
  if (!permissions || !Array.isArray(permissions)) return false;
  const normalized = requiredPermission.toLowerCase();
  const [mod] = normalized.split(':');
  return permissions.some((p) => {
    const perm = p.toLowerCase();
    return perm === '*' || perm === `${mod}:*` || perm === normalized;
  });
};

/**
 * Checks if a permissions array grants access to a specific module and action.
 *
 * @param permissions Array of permission strings
 * @param moduleName Module name (e.g. 'attendance', 'appointments')
 * @param actionName Action name (e.g. 'view', 'check_in')
 * @returns boolean
 */
export const can = (
  permissions: string[] | undefined | null,
  moduleName: string,
  actionName: string
): boolean => {
  if (!moduleName || !actionName) return false;
  return hasPermission(permissions, `${moduleName}:${actionName}`);
};
