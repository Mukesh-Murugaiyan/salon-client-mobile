/**
 * Validation Utility Class
 * Centralizes validation rules for user input, credentials, URLs, and coordinates.
 */
export class Validation {
  private static EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static PHONE_REGEX = /^\+?[0-9\s\-()]{7,15}$/;

  /**
   * Checks if string is a valid email address format.
   */
  static isValidEmail(email?: string | null): boolean {
    if (!email) return false;
    return this.EMAIL_REGEX.test(email.trim());
  }

  /**
   * Validates password presence and optional minimum length.
   */
  static isValidPassword(password?: string | null, minLength: number = 6): boolean {
    if (!password) return false;
    return password.length >= minLength;
  }

  /**
   * Validates login inputs and returns a structured validation outcome.
   */
  static validateLoginCredentials(
    email?: string | null,
    password?: string | null
  ): { isValid: boolean; error?: string } {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Please enter your email address.' };
    }
    if (!this.isValidEmail(email)) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { isValid: false, error: 'Please enter your password.' };
    }
    return { isValid: true };
  }

  /**
   * Validates international / standard telephone numbers.
   */
  static isValidPhone(phone?: string | null): boolean {
    if (!phone) return false;
    return this.PHONE_REGEX.test(phone.trim());
  }

  /**
   * Validates whether a string has non-whitespace characters.
   */
  static isNonEmpty(value?: string | null): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validates whether a string is a well-formed HTTP/HTTPS URL.
   */
  static isValidUrl(url?: string | null): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Validates geographic coordinates (latitude between -90 and 90, longitude between -180 and 180).
   */
  static isValidCoordinates(lat?: number | null, lng?: number | null): boolean {
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return false;
    }
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}
