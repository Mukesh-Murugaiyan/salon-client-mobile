/**
 * Number Utility Class
 * Centralizes numeric formatting, currency representation, and parsing.
 */
export class NumberUtils {
  /**
   * Formats a monetary amount into a localized currency string (defaults to INR ₹).
   * e.g. 500 -> "₹500", 12500 -> "₹12,500"
   */
  static formatCurrency(
    amount?: number | string | null,
    symbol: string = '₹',
    fractionDigits: number = 0
  ): string {
    if (amount === undefined || amount === null || amount === '') return `${symbol}0`;
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${symbol}0`;

    const formatted = num.toLocaleString('en-IN', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

    return `${symbol}${formatted}`;
  }

  /**
   * Formats a numeric value with standard thousands separators.
   */
  static formatNumber(value?: number | string | null): string {
    if (value === undefined || value === null || value === '') return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  }

  /**
   * Restricts a number to be within specified bounds [min, max].
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Rounds a number to a specified number of decimal places.
   */
  static round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Safely parses any value to a number, returning fallback if invalid.
   */
  static parseNumber(value: unknown, fallback: number = 0): number {
    if (typeof value === 'number') return isNaN(value) ? fallback : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  /**
   * Calculates a percentage between 0 and 100.
   */
  static toPercentage(value: number, total: number, decimals: number = 0): number {
    if (!total || total <= 0) return 0;
    const pct = (value / total) * 100;
    return this.round(pct, decimals);
  }
}
