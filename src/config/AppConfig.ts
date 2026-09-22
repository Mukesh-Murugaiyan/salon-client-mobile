/**
 * AppConfig Class
 * Centralizes application-level constants, operational defaults, and configuration.
 */
export class AppConfig {
  static readonly APP_NAME = 'Salon CRM';
  static readonly APP_SUBTITLE = 'Staff & Attendance Portal';
  static readonly APP_VERSION = '1.0.0';

  /**
   * Salon Operating Hours Defaults
   */
  static readonly OPERATING_HOURS = {
    DEFAULT_OPENING_TIME: '09:00',
    DEFAULT_CLOSING_TIME: '20:00',
  } as const;

  /**
   * Geofencing Defaults
   */
  static readonly GEOFENCING = {
    DEFAULT_ALLOWED_RADIUS_METERS: 100,
    HIGH_ACCURACY_ENABLED: true,
  } as const;

  /**
   * Subscription thresholds
   */
  static readonly SUBSCRIPTION = {
    EXPIRING_SOON_DAYS: 5,
  } as const;

  /**
   * Persistent Secure Storage Keys
   */
  static readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'salon_auth_token',
    AUTH_USER: 'salon_auth_user',
    CUSTOM_API_URL: 'salon_custom_api_url',
  } as const;

  /**
   * Evaluator / Test Account Quick Credentials
   */
  static readonly TEST_ACCOUNTS = [
    {
      label: 'Owner A',
      email: 'ownera@salon.com',
      password: 'Password@123',
      salonName: 'Salon A',
      role: 'OWNER',
    },
    {
      label: 'Receptionist A',
      email: 'receptionista@salon.com',
      password: 'Password@123',
      salonName: 'Salon A',
      role: 'RECEPTIONIST',
    },
    {
      label: 'Super Admin',
      email: 'superadmin@salon.com',
      password: 'Admin@123',
      salonName: 'System',
      role: 'SUPER_ADMIN',
    },
  ] as const;
}
