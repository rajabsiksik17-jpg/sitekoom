import { cn } from "@/lib/utils";
import { daysUntil, expiryTone, serviceTypeLabel, statusMeta, type StatusTone } from "@/lib/client-utils";
import { formatDate } from "@/lib/utils";

const toneClasses: Record<StatusTone, string> = {
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-600",
  brand: "bg-brand-50 text-brand-700",
};

export function StatusBadge({ status, locale = "ar" }: { status: string; locale?: "ar" | "en" }) {
  const meta = statusMeta(status);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", toneClasses[meta.tone])}>
      {locale === "ar" ? meta.ar : meta.en}
    </span>
  );
}

export function ExpiryChip({ date, locale = "ar" }: { date: string | null | undefined; locale?: "ar" | "en" }) {
  const days = daysUntil(date);
  const tone = expiryTone(days);
  const text =
    date === null || days === null
      ? locale === "ar" ? "غير محدد" : "—"
      : days < 0
        ? locale === "ar" ? `منتهي منذ ${Math.abs(days)} يوم` : `Expired ${Math.abs(days)}d ago`
        : locale === "ar"
          ? `متبقي ${days} يوم`
          : `${days} days left`;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", toneClasses[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
      {date && days !== null && days >= 0 && <span className="opacity-70">• {formatDate(date, locale)}</span>}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-ink-900">{children}</h2>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "brand" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: StatusTone }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-ink-900">{value}</p>
      {hint && <div className="mt-2">{hint}</div>}
    </div>
  );
}

export function serviceLabel(type: string, locale: "ar" | "en") {
  return serviceTypeLabel(type, locale);
}
