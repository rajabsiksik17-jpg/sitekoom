import type { Client } from "@/lib/types";

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export type StatusTone = "green" | "amber" | "red" | "gray" | "brand";

export function expiryTone(days: number | null): StatusTone {
  if (days === null) return "gray";
  if (days < 0) return "red";
  if (days <= 30) return "amber";
  if (days <= 90) return "brand";
  return "green";
}

export function statusMeta(status: string): { tone: StatusTone; ar: string; en: string } {
  switch (status) {
    case "active":
      return { tone: "green", ar: "نشط", en: "Active" };
    case "expiring":
      return { tone: "amber", ar: "قريب الانتهاء", en: "Expiring" };
    case "expired":
      return { tone: "red", ar: "منتهي", en: "Expired" };
    case "renewal_requested":
      return { tone: "brand", ar: "بانتظار التجديد", en: "Renewal requested" };
    case "renewed":
      return { tone: "green", ar: "تم التجديد", en: "Renewed" };
    case "suspended":
      return { tone: "red", ar: "موقوف", en: "Suspended" };
    case "maintenance":
      return { tone: "amber", ar: "صيانة", en: "Maintenance" };
    case "inactive":
      return { tone: "gray", ar: "غير نشط", en: "Inactive" };
    case "new":
      return { tone: "brand", ar: "جديد", en: "New" };
    case "in_progress":
      return { tone: "amber", ar: "قيد التنفيذ", en: "In progress" };
    case "completed":
      return { tone: "green", ar: "مكتمل", en: "Completed" };
    case "closed":
      return { tone: "gray", ar: "مغلق", en: "Closed" };
    default:
      return { tone: "gray", ar: status, en: status };
  }
}

export function serviceTypeLabel(type: string, locale: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    subscription: { ar: "اشتراك", en: "Subscription" },
    domain: { ar: "دومين", en: "Domain" },
    hosting: { ar: "استضافة", en: "Hosting" },
  };
  const m = map[type] ?? { ar: type, en: type };
  return locale === "ar" ? m.ar : m.en;
}

export function websiteName(client: Client): string {
  return client.website_url ?? client.company ?? client.name;
}
