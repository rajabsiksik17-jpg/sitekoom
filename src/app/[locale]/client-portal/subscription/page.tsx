import Link from "next/link";
import { getCurrentClient, getClientSubscriptions } from "@/lib/client-data";
import { localizePath } from "@/lib/i18n/config";
import { ExpiryChip, SectionTitle, StatusBadge } from "@/components/client-portal/bits";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientSubscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const client = await getCurrentClient(locale);
  const items = await getClientSubscriptions(client.id);
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
        {t("الاشتراكات", "Subscriptions")}
      </SectionTitle>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد اشتراكات.", "No subscriptions.")}</div>
        ) : (
          items.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink-900">{s.plan ?? t("اشتراك", "Subscription")}</p>
                  {s.renewal_duration && <p className="text-xs text-gray-400">{s.renewal_duration}</p>}
                </div>
                <StatusBadge status={s.status} locale={locale} />
              </div>
              <div className="mt-4 grid gap-3 border-t border-brand-50 pt-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-400">{t("تاريخ البداية", "Start date")}</p>
                  <p className="font-medium text-ink-900">{formatDate(s.start_date, locale)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("تاريخ الانتهاء", "Expiry date")}</p>
                  <p className="font-medium text-ink-900">{formatDate(s.expiry_date, locale)}</p>
                  <div className="mt-1"><ExpiryChip date={s.expiry_date} locale={locale} /></div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("قيمة التجديد", "Renewal price")}</p>
                  <p className="font-semibold text-brand-700" dir="ltr">{Number(s.renewal_price).toLocaleString()} {t("د.أ", "JOD")}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
