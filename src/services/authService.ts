import apiClient from './apiClient';
import { AuthResponse, User } from '../types/auth';
import { ApiConfig } from '../config/ApiConfig';

export const AuthService = {
  /**
   * Authenticates user against backend API.
   * Backend returns { user, token }.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(ApiConfig.ENDPOINTS.AUTH.LOGIN, {
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data;
  },

  /**
   * Fetches current authenticated user profile and permissions from session.
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<{ user: User }>(ApiConfig.ENDPOINTS.AUTH.ME);
    return response.data.user;
  },

  /**
   * Stateless logout call to backend.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
  },
};
