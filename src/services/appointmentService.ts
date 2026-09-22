import apiClient from './apiClient';
import { Appointment, AppointmentsResponse } from '../types/appointment';
import { DateTime } from '../utils/DateTime';
import { ApiConfig } from '../config/ApiConfig';

export const AppointmentService = {
  /**
   * Retrieves today's appointments for the authenticated user's salon.
   * Scoped by date (YYYY-MM-DD) supporting both local and UTC representations.
   * Backend strictly enforces tenant isolation.
   */
  async getTodayAppointments(): Promise<Appointment[]> {
    const todayLocal = DateTime.getTodayLocalDateString();
    const todayUTC = DateTime.getTodayUtcDateString();

    // Query both local and UTC date strings to match backend's dashboard aggregation
    const dateParam = todayLocal === todayUTC ? todayLocal : `${todayLocal},${todayUTC}`;

    const response = await apiClient.get<AppointmentsResponse>(
      ApiConfig.ENDPOINTS.APPOINTMENTS.LIST,
      {
        params: { date: dateParam },
      }
    );

    return response.data.appointments || [];
  },
};
