import { getCurrentClient, getClientRenewalRequests, getClientRenewalHistory, getClientSubscriptions, getClientDomains, getClientHosting } from "@/lib/client-data";
import { RenewalForm, type RenewalOption } from "@/components/client-portal/renewal-form";
import { SectionTitle, StatusBadge } from "@/components/client-portal/bits";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientRenewalsPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const [requests, history, subscriptions, domains, hosting] = await Promise.all([
    getClientRenewalRequests(client.id),
    getClientRenewalHistory(client.id),
    getClientSubscriptions(client.id),
    getClientDomains(client.id),
    getClientHosting(client.id),
  ]);

  const options: RenewalOption[] = [
    ...subscriptions.map((s) => ({ kind: "subscription" as const, id: s.id, name: s.plan ?? "Subscription", amount: Number(s.renewal_price), expiry: s.expiry_date })),
    ...domains.map((d) => ({ kind: "domain" as const, id: d.id, name: d.domain_name, amount: Number(d.renewal_price), expiry: d.expiry_date })),
    ...hosting.map((h) => ({ kind: "hosting" as const, id: h.id, name: h.plan ?? "Hosting", amount: Number(h.renewal_price), expiry: h.expiry_date })),
  ];

  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>{t("طلبات التجديد", "Renewal Requests")}</SectionTitle>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد طلبات تجديد بعد.", "No renewal requests yet.")}</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink-900">{r.service_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(r.created_at, locale)}</p>
                    </div>
                    <StatusBadge status={r.status} locale={locale} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                    {r.renewal_duration && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{r.renewal_duration}</span>}
                    {r.amount > 0 && <span className="font-semibold text-brand-700" dir="ltr">{Number(r.amount).toLocaleString()} {t("د.أ", "JOD")}</span>}
                  </div>
                  {r.message && <p className="mt-2 rounded-lg bg-brand-50 p-3 text-sm text-gray-600">{r.message}</p>}
                </div>
              ))
            )}
          </div>

          <RenewalForm options={options} locale={locale} />
        </div>
      </div>

      <div>
        <SectionTitle>{t("سجل التجديدات", "Renewal History")}</SectionTitle>
        {history.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{t("لا يوجد سجل تجديد بعد.", "No renewal history yet.")}</div>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink-900">{h.service_type === "subscription" ? t("تجديد اشتراك", "Subscription renewal") : h.service_type === "domain" ? t("تجديد دومين", "Domain renewal") : t("تجديد استضافة", "Hosting renewal")}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(h.approved_at ?? h.created_at, locale)}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">{t("معتمد", "Approved")}</span>
                </div>
                <div className="mt-4 grid gap-3 border-t border-brand-50 pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-400">{t("المدة", "Duration")}</p>
                    <p className="font-semibold text-ink-900">{h.duration} <span className="text-xs text-gray-500">({h.days_added} {t("يوم", "days")})</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("الانتهاء السابق", "Old expiry")}</p>
                    <p className="font-semibold text-ink-900">{h.old_expiry ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("الانتهاء الجديد", "New expiry")}</p>
                    <p className="font-semibold text-brand-700">{h.new_expiry ?? "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
