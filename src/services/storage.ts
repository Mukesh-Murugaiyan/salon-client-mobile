import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types/auth';

import { AppConfig } from '../config/AppConfig';

const TOKEN_KEY = AppConfig.STORAGE_KEYS.AUTH_TOKEN;
const USER_KEY = AppConfig.STORAGE_KEYS.AUTH_USER;
const API_URL_KEY = AppConfig.STORAGE_KEYS.CUSTOM_API_URL;

const memoryFallback: Record<string, string> = {};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch { }
    memoryFallback[key] = value;
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[SecureStore] Error saving key "${key}":`, error);
    memoryFallback[key] = value;
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch { }
    return memoryFallback[key] || null;
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[SecureStore] Error reading key "${key}":`, error);
    return memoryFallback[key] || null;
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch { }
    delete memoryFallback[key];
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[SecureStore] Error deleting key "${key}":`, error);
    delete memoryFallback[key];
  }
}

export const StorageService = {
  async saveAuthToken(token: string): Promise<void> {
    await setItem(TOKEN_KEY, token);
  },

  async getAuthToken(): Promise<string | null> {
    return await getItem(TOKEN_KEY);
  },

  async deleteAuthToken(): Promise<void> {
    await deleteItem(TOKEN_KEY);
  },

  async saveUserData(user: User): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },

  async getUserData(): Promise<User | null> {
    const data = await getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  },

  async deleteUserData(): Promise<void> {
    await deleteItem(USER_KEY);
  },

  async clearSession(): Promise<void> {
    await Promise.all([deleteItem(TOKEN_KEY), deleteItem(USER_KEY)]);
  },

  async saveCustomApiUrl(url: string): Promise<void> {
    await setItem(API_URL_KEY, url);
  },

  async getCustomApiUrl(): Promise<string | null> {
    return await getItem(API_URL_KEY);
  },
};
