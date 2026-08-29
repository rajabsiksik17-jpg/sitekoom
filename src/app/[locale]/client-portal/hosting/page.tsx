import Link from "next/link";
import { getCurrentClient, getClientHosting } from "@/lib/client-data";
import { localizePath } from "@/lib/i18n/config";
import { ExpiryChip, SectionTitle, StatusBadge } from "@/components/client-portal/bits";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientHostingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const client = await getCurrentClient(locale);
  const items = await getClientHosting(client.id);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle
        action={
          <Link href={localizePath("/client-portal/renewals", locale)} className="btn-primary px-4 py-2 text-sm">
            {t("طلب تجديد", "Request Renewal")}
          </Link>
        }
      >
        {t("الاستضافة", "Hosting")}
      </SectionTitle>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد خدمات استضافة.", "No hosting services.")}</div>
        ) : (
          items.map((h) => (
            <div key={h.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink-900">{h.plan ?? t("استضافة", "Hosting")}</p>
                  {h.provider && <p className="text-xs text-gray-400">{h.provider}</p>}
                </div>
                <StatusBadge status={h.status} locale={locale} />
              </div>
              <div className="mt-4 grid gap-3 border-t border-brand-50 pt-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-400">{t("تاريخ البداية", "Start date")}</p>
                  <p className="font-medium text-ink-900">{formatDate(h.start_date, locale)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("تاريخ الانتهاء", "Expiry date")}</p>
                  <p className="font-medium text-ink-900">{formatDate(h.expiry_date, locale)}</p>
                  <div className="mt-1"><ExpiryChip date={h.expiry_date} locale={locale} /></div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("قيمة التجديد", "Renewal price")}</p>
                  <p className="font-semibold text-brand-700" dir="ltr">{Number(h.renewal_price).toLocaleString()} {t("د.أ", "JOD")}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
