/**
 * String Utility Class
 * Centralizes common string manipulation, formatting, and sanitization.
 */
export class StringUtils {
  /**
   * Capitalizes the first letter of a string.
   */
  static capitalize(str?: string | null): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Converts a string into Title Case (e.g. "hair styling" -> "Hair Styling").
   */
  static toTitleCase(str?: string | null): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Trims whitespace safely, returning empty string for null/undefined.
   */
  static trim(str?: string | null): string {
    return (str || '').trim();
  }

  /**
   * Truncates a string to a given length with an ellipsis.
   */
  static truncate(str?: string | null, maxLength: number = 30, suffix: string = '...'): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength).trimEnd() + suffix;
  }

  /**
   * Extracts initials from a name (e.g. "John Doe" -> "JD", "Salon" -> "S").
   */
  static getInitials(name?: string | null): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Masks sensitive text like phone numbers or emails.
   */
  static maskSensitive(str?: string | null, visibleEndCount: number = 4): string {
    if (!str) return '';
    if (str.length <= visibleEndCount) return str;
    const maskedPart = '*'.repeat(str.length - visibleEndCount);
    const visiblePart = str.slice(-visibleEndCount);
    return maskedPart + visiblePart;
  }

  /**
   * Sanitizes string by removing control and invisible characters.
   */
  static sanitize(str?: string | null): string {
    if (!str) return '';
    return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
  }
}
