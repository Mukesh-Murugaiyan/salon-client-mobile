import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiConfig } from '../config/ApiConfig';
import { StorageService } from './storage';

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedCallback(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

const apiClient: AxiosInstance = axios.create({
  timeout: ApiConfig.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = ApiConfig.getBaseUrl();

    const token = await StorageService.getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const responseData = error.response?.data;

    if (status === 401) {
      await StorageService.clearSession();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    let friendlyMessage = 'Something went wrong. Please try again.';

    if (!error.response) {
      friendlyMessage = 'Unable to connect to salon server. Please check your network or server URL.';
    } else if (responseData?.message) {
      friendlyMessage = responseData.message;
    } else if (status === 403) {
      if (responseData?.error === 'SUBSCRIPTION_EXPIRED') {
        friendlyMessage = 'Your subscription has expired. Please contact the administrator to renew your plan.';
      } else if (responseData?.error === 'OUT_OF_RANGE') {
        friendlyMessage = 'You are outside the allowed salon location.';
      } else {
        friendlyMessage = 'Access denied. You do not have permission for this action.';
      }
    } else if (status === 400) {
      friendlyMessage = responseData?.message || 'Invalid request. Please check your input.';
    } else if (status && status >= 500) {
      friendlyMessage = 'Something went wrong on the server. Please try again.';
    }

    const customError = new Error(friendlyMessage) as Error & {
      statusCode?: number;
      errorCode?: string;
      rawError?: ApiErrorResponse;
    };
    customError.statusCode = status;
    customError.errorCode = responseData?.error;
    customError.rawError = responseData;

    return Promise.reject(customError);
  }
);

export default apiClient;
