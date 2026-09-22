import apiClient from './apiClient';
import { DashboardSummary, SubscriptionStatusData } from '../types/dashboard';
import { ApiConfig } from '../config/ApiConfig';

export const DashboardService = {
  /**
   * Retrieves dashboard summary metrics for the salon.
   * Includes todayAppointments count and subscriptionStatus.
   */
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<{ success: boolean; data: DashboardSummary }>(
      ApiConfig.ENDPOINTS.DASHBOARD.SUMMARY
    );
    return response.data.data;
  },

  /**
   * Retrieves active salon subscription details (plan name, end date, days remaining).
   * If user has no subscription view permissions (e.g., RECEPTIONIST), safely returns null.
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatusData | null> {
    try {
      const response = await apiClient.get<{ success: boolean; subscription: SubscriptionStatusData }>(
        ApiConfig.ENDPOINTS.SUBSCRIPTION.STATUS
      );
      return response.data.subscription;
    } catch (error: any) {
      // If 403 Forbidden (e.g. receptionist without subscription:view), return null gracefully
      if (error?.statusCode === 403) {
        return null;
      }
      throw error;
    }
  },
};
