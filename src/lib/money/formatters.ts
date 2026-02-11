import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/**
 * Format cents as a currency string.
 * e.g. formatCurrency(1234, "USD") → "$12.34"
 */
export function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format cents as a plain number string (no currency symbol).
 * e.g. formatAmount(1234) → "12.34"
 */
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Format a timestamp to a relative or absolute date string.
 * Today → "2:30 PM"
 * Yesterday → "Yesterday"
 * Otherwise → "Feb 10"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  if (date.getFullYear() === new Date().getFullYear()) return format(date, "MMM d");
  return format(date, "MMM d, yyyy");
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelative(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Parse a user-entered currency string to cents.
 * "12.50" → 1250
 * "12" → 1200
 */
export function parseToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}

/**
 * Common currencies for the household default currency selector
 */
export const COMMON_CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "BRL", label: "BRL — Brazilian Real" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
];
