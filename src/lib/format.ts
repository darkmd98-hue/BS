/**
 * Centralized formatting and internationalization helpers.
 * Addresses Problem 56 (hardcoded currency) and Problem 57 (timezone date parsing).
 */

export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "INR";
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en-IN";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  NPR: "रू",
  LKR: "Rs",
  THB: "฿",
};

/**
 * Format numeric amount into localized currency string.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  const rounded = Math.round(num);
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || `${currency} `;

  try {
    const formattedNum = Math.abs(rounded).toLocaleString(locale);
    const sign = rounded < 0 ? "-" : "";
    return `${sign}${symbol}${formattedNum}`;
  } catch {
    return `${symbol}${rounded}`;
  }
}

/**
 * Short alias for default currency formatting.
 */
export const fmt = (n: number | string | null | undefined) => formatCurrency(n);

/**
 * Parse YYYY-MM-DD date string safely without UTC timezone shift.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  if (!year || !month || !day) return new Date(dateStr);
  return new Date(year, month - 1, day);
}

/**
 * Calculate stay duration in nights between two YYYY-MM-DD date strings.
 */
export function calculateNights(checkInStr: string, checkOutStr: string): number {
  const d1 = parseLocalDate(checkInStr);
  const d2 = parseLocalDate(checkOutStr);
  const diffMs = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(365, diffDays));
}

/**
 * Format a date string into readable localized format.
 */
export function formatDate(
  dateStr: string | null | undefined,
  locale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return "—";
  try {
    const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr);
    return d.toLocaleDateString(
      locale,
      options || { year: "numeric", month: "short", day: "numeric" }
    );
  } catch {
    return dateStr;
  }
}
