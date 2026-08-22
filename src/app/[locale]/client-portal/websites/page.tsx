import { ExternalLink, Globe, LogOut } from "lucide-react";
import { getCurrentClient, getClientWebsites } from "@/lib/client-data";
import { ExpiryChip, SectionTitle, StatusBadge } from "@/components/client-portal/bits";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, { ar: string; en: string }> = {
  wordpress: { ar: "ووردبريس", en: "WordPress" },
  woocommerce: { ar: "متجر ووكومرس", en: "WooCommerce" },
  custom: { ar: "نظام مخصص", en: "Custom" },
  laravel: { ar: "لارافل", en: "Laravel" },
  dotnet: { ar: ".NET", en: ".NET" },
  other: { ar: "أخرى", en: "Other" },
};

export default async function ClientWebsitesPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const websites = await getClientWebsites(client.id);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("مواقعي", "My Websites")}</SectionTitle>
      <div className="space-y-4">
        {websites.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد مواقع مسجلة بعد.", "No websites registered yet.")}</div>
        ) : (
          websites.map((w) => (
            <div key={w.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Globe className="h-5 w-5" /></span>
                  <div>
                    <p className="font-bold text-ink-900">{w.name}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{w.domain}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={w.status} locale={locale} />
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        {typeLabels[w.website_type] ? (locale === "ar" ? typeLabels[w.website_type].ar : typeLabels[w.website_type].en) : w.website_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 border-t border-brand-50 pt-4 text-sm sm:grid-cols-2">
                {w.website_url && (
                  <a href={w.website_url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-2">
                    {t("زيارة الموقع", "Visit Site")} <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {w.admin_url && (
                  <a href={`/api/client/sso?website=${w.id}`} target="_blank" rel="noopener noreferrer" className="btn-primary px-3 py-2">
                    {t("فتح لوحة التحكم", "Open Dashboard")} <LogOut className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
