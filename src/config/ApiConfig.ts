import { Platform } from 'react-native';

/**
 * ApiConfig Class
 * Centralizes API networking endpoints, base URL resolution, and timeout configs.
 */
export class ApiConfig {
  static readonly DEFAULT_PORT = '5001';
  static readonly TIMEOUT_MS = 15000;

  private static currentBaseUrl: string = ApiConfig.resolveDefaultBaseUrl();

  /**
   * Resolves the default backend base URL according to the active runtime platform.
   * - Android Emulator: http://10.0.2.2:5001/api
   * - iOS Simulator / Physical Device / Web: http://localhost:5001/api
   * Can be overridden by EXPO_PUBLIC_API_URL environment variable.
   */
  static resolveDefaultBaseUrl(): string {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }

    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${this.DEFAULT_PORT}/api`;
    }

    return `http://localhost:${this.DEFAULT_PORT}/api`;
  }

  /**
   * Returns current active API base URL.
   */
  static getBaseUrl(): string {
    return this.currentBaseUrl;
  }

  /**
   * Updates the runtime base URL (removes any trailing slash).
   */
  static setBaseUrl(url: string): void {
    if (!url) return;
    const trimmed = url.trim();
    this.currentBaseUrl = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }

  /**
   * Centralized API endpoint routes
   */
  static readonly ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      ME: '/auth/me',
    },
    DASHBOARD: {
      SUMMARY: '/dashboard/summary',
    },
    ATTENDANCE: {
      CHECK_IN: '/attendance/check-in',
      CHECK_OUT: '/attendance/check-out',
      TODAY: '/attendance/today',
    },
    APPOINTMENTS: {
      LIST: '/appointments',
    },
    SUBSCRIPTION: {
      STATUS: '/subscription/status',
    },
  } as const;
}
