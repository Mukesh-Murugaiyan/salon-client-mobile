import { ApiConfig } from './ApiConfig';

/**
 * Backward-compatible helper functions delegating to ApiConfig.
 */
export function getDefaultApiBaseUrl(): string {
  return ApiConfig.resolveDefaultBaseUrl();
}

export function getApiBaseUrl(): string {
  return ApiConfig.getBaseUrl();
}

export function setApiBaseUrl(url: string): void {
  ApiConfig.setBaseUrl(url);
}

export { ApiConfig } from './ApiConfig';
export { AppConfig } from './AppConfig';
