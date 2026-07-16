import { ELIGIBLE_DAYS } from "./constants";

const BANGLA_DIGITS: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

/**
 * Normalize a Bangladeshi phone number to `01XXXXXXXXX`.
 * Handles Bangla numerals (০১৭...), +880 prefix, spaces and dashes.
 * Returns null if it can't be turned into a valid BD mobile number.
 */
export function normalizeBdPhone(raw: string): string | null {
  let s = raw
    .split("")
    .map((ch) => BANGLA_DIGITS[ch] ?? ch)
    .join("")
    .replace(/[^0-9]/g, "");
  if (s.startsWith("880")) s = "0" + s.slice(3);
  if (/^1[3-9][0-9]{8}$/.test(s)) s = "0" + s;
  return /^01[3-9][0-9]{8}$/.test(s) ? s : null;
}

export function isEligible(lastDonationDate: string | null): boolean {
  if (!lastDonationDate) return true;
  return daysSince(lastDonationDate) >= ELIGIBLE_DAYS;
}

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr + "T00:00:00");
  return Math.floor((Date.now() - then.getTime()) / 86_400_000);
}

export function daysUntilEligible(lastDonationDate: string | null): number {
  if (!lastDonationDate) return 0;
  return Math.max(0, ELIGIBLE_DAYS - daysSince(lastDonationDate));
}

/** Format a date for the given locale (bn -> Bangla numerals, e.g. ১৬ জুলাই ২০২৬) */
export function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    locale === "bn" ? "bn-BD" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

/** Localized digits: 12 -> ১২ for bn */
export function localizeNumber(n: number, locale: string): string {
  return n.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB");
}

/** WhatsApp deep link for a BD number */
export function whatsappLink(phone01: string): string {
  return `https://wa.me/880${phone01.slice(1)}`;
}
