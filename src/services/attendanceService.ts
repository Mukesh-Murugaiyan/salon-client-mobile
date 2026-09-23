import * as Location from 'expo-location';
import apiClient from './apiClient';
import { AttendanceTodayResponse, CheckInResponse } from '../types/dashboard';
import { ApiConfig } from '../config/ApiConfig';
import { Validation } from '../utils/Validation';

export class LocationServiceError extends Error {
  code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'UNABLE_TO_LOCATE';

  constructor(message: string, code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'UNABLE_TO_LOCATE') {
    super(message);
    this.name = 'LocationServiceError';
    this.code = code;
  }
}

export const AttendanceService = {
  /**
   * Fetches today's check-in status for the authenticated user.
   */
  async getTodayStatus(): Promise<AttendanceTodayResponse> {
    const response = await apiClient.get<AttendanceTodayResponse>(
      ApiConfig.ENDPOINTS.ATTENDANCE.TODAY
    );
    return response.data;
  },

  /**
   * Acquires device GPS coordinates following all permissions and device checks.
   * Throws LocationServiceError with clear user-friendly messages.
   */
  async getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
    const isServiceEnabled = await Location.hasServicesEnabledAsync();
    if (!isServiceEnabled) {
      throw new LocationServiceError(
        'Location services are disabled on your device. Please enable device location services to check in.',
        'SERVICES_DISABLED'
      );
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      throw new LocationServiceError(
        'Location permission is required to check in.',
        'PERMISSION_DENIED'
      );
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!position || !position.coords) {
        throw new Error('Coordinates missing');
      }

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      throw new LocationServiceError(
        'Unable to get your current location. Please try again.',
        'UNABLE_TO_LOCATE'
      );
    }
  },

  /**
   * Submits employee check-in with device GPS coordinates.
   * The backend performs server-side Haversine geo-fencing calculation.
   */
  async checkIn(latitude: number, longitude: number): Promise<CheckInResponse> {
    if (!Validation.isValidCoordinates(latitude, longitude)) {
      throw new LocationServiceError('Invalid GPS coordinates acquired.', 'UNABLE_TO_LOCATE');
    }

    const response = await apiClient.post<CheckInResponse>(
      ApiConfig.ENDPOINTS.ATTENDANCE.CHECK_IN,
      {
        latitude,
        longitude,
      }
    );
    return response.data;
  },
};
