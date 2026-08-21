import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string | Date | null | undefined, locale = "ar"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function formatDateTime(date: string | Date | null | undefined, locale = "ar"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function timeAgo(date: string | Date | null | undefined, locale = "ar"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return locale === "ar" ? "الآن" : "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === "ar" ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return locale === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
  return formatDate(date, locale);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function safeJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value as T;
}

export function localize<T = string>(
  locale: string | undefined,
  arValue: T | null | undefined,
  enValue: T | null | undefined,
): T {
  const useAr = (locale ?? "ar") === "ar";
  const arVal = arValue ?? null;
  const enVal = enValue ?? null;
  if (useAr) return (arVal ?? enVal ?? "") as T;
  return (enVal ?? arVal ?? "") as T;
}
