import { useAuth } from '../context/AuthContext';
import { hasPermission, can } from '../utils/permission';

export { hasPermission, can };

/**
 * React hook providing reactive, dynamic permission checks based on logged-in user.
 * ZERO hardcoded role checks. 100% database-driven permissions.
 */
export const usePermission = () => {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  return {
    permissions,
    can: (moduleName: string, actionName: string) => can(permissions, moduleName, actionName),
    hasPermission: (permission: string) => hasPermission(permissions, permission),

    // Granular permission flags for mobile features
    canCheckInAttendance: can(permissions, 'attendance', 'check_in'),
    canViewAttendance: can(permissions, 'attendance', 'check_in') || can(permissions, 'attendance', 'view'),
    canViewAppointments: can(permissions, 'appointments', 'view'),
    canViewSubscription: can(permissions, 'subscription', 'view'),
    canViewDashboard: can(permissions, 'dashboard', 'view'),
  };
};

export default usePermission;
