import * as Location from 'expo-location';
import apiClient from './apiClient';
import { AttendanceTodayResponse, CheckInResponse, SalonLocationConfig } from '../types/dashboard';
import { ApiConfig } from '../config/ApiConfig';
import { Validation } from '../utils/Validation';
import { DistanceUtils } from '../utils/DistanceUtils';

export class LocationServiceError extends Error {
  code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'UNABLE_TO_LOCATE' | 'INVALID_COORDINATES';

  constructor(
    message: string,
    code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'UNABLE_TO_LOCATE' | 'INVALID_COORDINATES'
  ) {
    super(message);
    this.name = 'LocationServiceError';
    this.code = code;
  }
}

export interface GeofenceDetails {
  distance: number;
  allowedRadius: number;
  exceededBy: number;
}

export const AttendanceService = {
  /**
   * Fetches today's check-in status and salon location configuration for the authenticated user.
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
        'Location services are disabled on your device. Please enable device location services in settings to check in.',
        'SERVICES_DISABLED'
      );
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      throw new LocationServiceError(
        'Location permission was denied. Please grant location access to verify attendance check-in.',
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
        'Unable to acquire current GPS location. Please ensure you have a clear GPS signal and try again.',
        'UNABLE_TO_LOCATE'
      );
    }
  },

  /**
   * Calculates live distance between current device GPS location and the salon.
   */
  async getLiveDistanceToSalon(salonLocation: SalonLocationConfig) {
    if (!salonLocation.latitude || !salonLocation.longitude) {
      throw new Error('Salon location coordinates are not configured.');
    }

    const userCoords = await this.getCurrentCoordinates();
    return DistanceUtils.getGeofenceStatus(
      userCoords.latitude,
      userCoords.longitude,
      salonLocation.latitude,
      salonLocation.longitude,
      salonLocation.allowedRadius
    );
  },

  /**
   * Submits employee check-in with device GPS coordinates.
   * The backend strictly performs server-side Haversine geo-fencing calculation and authorization.
   */
  async checkIn(latitude: number, longitude: number): Promise<CheckInResponse> {
    if (!Validation.isValidCoordinates(latitude, longitude)) {
      throw new LocationServiceError('Invalid GPS coordinates acquired.', 'INVALID_COORDINATES');
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
