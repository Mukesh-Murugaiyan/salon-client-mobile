/**
 * DateTime Utility Class
 * Centralizes all date and time manipulation, formatting, and duration calculations.
 */
export class DateTime {
  /**
   * Formats a date into a localized readable date string (e.g., "Sep 23, 2026").
   * Handles ISO strings, Date objects, or YYYY-MM-DD strings.
   */
  static formatDate(
    dateInput?: string | Date | null,
    options?: Intl.DateTimeFormatOptions
  ): string {
    if (!dateInput) return 'N/A';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return String(dateInput);

      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };

      return date.toLocaleDateString([], options || defaultOptions);
    } catch {
      return String(dateInput);
    }
  }

  /**
   * Formats a timestamp/ISO string to localized time (e.g., "09:30 AM").
   */
  static formatTime(isoStringOrDate?: string | Date | null): string {
    if (!isoStringOrDate) return '';
    try {
      const date =
        typeof isoStringOrDate === 'string'
          ? new Date(isoStringOrDate)
          : isoStringOrDate;
      if (isNaN(date.getTime())) return String(isoStringOrDate);

      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(isoStringOrDate);
    }
  }

  /**
   * Converts a 24-hour time string ("HH:mm") into 12-hour format with AM/PM (e.g. "09:00" -> "9:00 AM", "20:00" -> "8:00 PM").
   */
  static formatTime12h(timeStr?: string | null): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return timeStr;

    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }

  /**
   * Formats a date for screen headers (e.g. "Wednesday, Sep 23, 2026").
   */
  static formatHeaderDate(dateInput?: string | Date): string {
    const date = dateInput
      ? typeof dateInput === 'string'
        ? new Date(dateInput)
        : dateInput
      : new Date();

    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Returns current time as "HH:mm" in 24-hour format.
   */
  static getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Returns today's date formatted as local "YYYY-MM-DD".
   */
  static getTodayLocalDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Returns today's date formatted as UTC "YYYY-MM-DD".
   */
  static getTodayUtcDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculates duration between two "HH:mm" time strings or Date instances.
   * Returns human-readable duration like "45 mins" or "1 hr 30 mins".
   */
  static calculateDuration(
    startTime: string | Date,
    endTime: string | Date
  ): string {
    try {
      let startMinutes = 0;
      let endMinutes = 0;

      if (startTime instanceof Date && endTime instanceof Date) {
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        startMinutes = 0;
        endMinutes = diffMinutes;
      } else if (typeof startTime === 'string' && typeof endTime === 'string') {
        const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
        const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10));
        startMinutes = (startH || 0) * 60 + (startM || 0);
        endMinutes = (endH || 0) * 60 + (endM || 0);
      }

      const totalDiff = Math.max(0, endMinutes - startMinutes);
      const hours = Math.floor(totalDiff / 60);
      const mins = totalDiff % 60;

      if (hours > 0 && mins > 0) {
        return `${hours} hr ${mins} mins`;
      } else if (hours > 0) {
        return `${hours} hr${hours > 1 ? 's' : ''}`;
      } else {
        return `${mins} min${mins !== 1 ? 's' : ''}`;
      }
    } catch {
      return 'N/A';
    }
  }

  /**
   * Checks if a given date string or Date is today.
   */
  static isToday(dateInput: string | Date): boolean {
    const target = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const today = new Date();
    return (
      target.getDate() === today.getDate() &&
      target.getMonth() === today.getMonth() &&
      target.getFullYear() === today.getFullYear()
    );
  }
}
