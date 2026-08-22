// Days added per requested duration. 1 year = 360 days (12 * 30) per product spec.
export const DURATION_OPTIONS = [
  { months: 1, days: 30, ar: "شهر واحد", en: "1 month" },
  { months: 3, days: 90, ar: "3 أشهر", en: "3 months" },
  { months: 6, days: 180, ar: "6 أشهر", en: "6 months" },
  { months: 12, days: 360, ar: "سنة واحدة", en: "1 year" },
  { months: 24, days: 720, ar: "سنتان", en: "2 years" },
] as const;

export function durationDays(months: number): number {
  return Math.round(months * 30);
}

export function durationLabel(months: number, locale: "ar" | "en"): string {
  const opt = DURATION_OPTIONS.find((o) => o.months === months);
  if (opt) return locale === "ar" ? opt.ar : opt.en;
  return months === 1 ? "1 month" : `${months} months`;
}

/**
 * Compute the new expiry without losing remaining days:
 *  - If the current expiry is still in the future, extend FROM it.
 *  - If it already expired, extend FROM today (approval date).
 */
export function computeNewExpiry(currentExpiry: string | null | undefined, days: number, now = new Date()): string {
  const today = new Date(now.toISOString().slice(0, 10));
  let base = today;
  if (currentExpiry) {
    const d = new Date(currentExpiry);
    if (!isNaN(d.getTime()) && d > today) base = d;
  }
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
