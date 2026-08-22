import { getCurrentClient, getClientRenewalRequests, getClientSubscriptions, getClientDomains, getClientHosting } from "@/lib/client-data";
import { RenewalForm, type RenewalOption } from "@/components/client-portal/renewal-form";
import { SectionTitle, StatusBadge } from "@/components/client-portal/bits";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientRenewalsPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const [requests, subscriptions, domains, hosting] = await Promise.all([
    getClientRenewalRequests(client.id),
    getClientSubscriptions(client.id),
    getClientDomains(client.id),
    getClientHosting(client.id),
  ]);

  const options: RenewalOption[] = [
    ...subscriptions.map((s) => ({ type: "subscription" as const, name: s.plan ?? "Subscription", amount: Number(s.renewal_price) })),
    ...domains.map((d) => ({ type: "domain" as const, name: d.domain_name, amount: Number(d.renewal_price) })),
    ...hosting.map((h) => ({ type: "hosting" as const, name: h.plan ?? "Hosting", amount: Number(h.renewal_price) })),
  ];

  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
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
                {r.amount > 0 && (
                  <p className="mt-2 text-sm font-semibold text-brand-700" dir="ltr">{Number(r.amount).toLocaleString()} {t("د.أ", "JOD")}</p>
                )}
                {r.message && <p className="mt-2 rounded-lg bg-brand-50 p-3 text-sm text-gray-600">{r.message}</p>}
              </div>
            ))
          )}
        </div>

        <RenewalForm options={options} locale={locale} />
      </div>
    </div>
  );
}
