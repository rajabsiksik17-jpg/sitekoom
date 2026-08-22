import Link from "next/link";
import { ExternalLink, Globe, LogOut } from "lucide-react";
import { getCurrentClient, getClientWebsites, getClientSubscriptions, getClientDomains, getClientHosting, getClientNotifications, getClientRenewalRequests } from "@/lib/client-data";
import { localizePath } from "@/lib/i18n/config";
import { ExpiryChip, SectionTitle, StatusBadge, StatCard } from "@/components/client-portal/bits";
import { formatDate, localize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientPortalDashboard({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);

  const [websites, subscriptions, domains, hosting, notifications, renewals] = await Promise.all([
    getClientWebsites(client.id),
    getClientSubscriptions(client.id),
    getClientDomains(client.id),
    getClientHosting(client.id),
    getClientNotifications(client.id),
    getClientRenewalRequests(client.id),
  ]);

  const nearestExpiry = (items: { expiry_date?: string | null }[]) =>
    items.map((i) => i.expiry_date).filter(Boolean).sort()[0] ?? null;

  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("مرحبًا", "Welcome")}, {client.name}</h1>
          <p className="text-sm text-gray-500">{t("هذه بوابتك للوصول إلى مواقعك وأنظمتك.", "This is your portal to access your websites and systems.")}</p>
        </div>
        {client.admin_url && (
          <a href="/api/client/sso" target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2.5 text-sm">
            {t("فتح لوحة التحكم", "Open Dashboard")}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("المواقع", "Websites")} value={websites.length} />
        <StatCard label={t("الاشتراكات", "Subscriptions")} value={subscriptions.length} hint={<ExpiryChip date={nearestExpiry(subscriptions)} locale={locale} />} />
        <StatCard label={t("الدومينات", "Domains")} value={domains.length} hint={<ExpiryChip date={nearestExpiry(domains)} locale={locale} />} />
        <StatCard label={t("الاستضافة", "Hosting")} value={hosting.length} hint={<ExpiryChip date={nearestExpiry(hosting)} locale={locale} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>{t("مواقعي", "My Websites")}</SectionTitle>
          <div className="space-y-3">
            {websites.length === 0 ? (
              <div className="card p-6 text-center text-sm text-gray-500">{t("لا توجد مواقع مسجلة بعد.", "No websites registered yet.")}</div>
            ) : (
              websites.map((w) => (
                <div key={w.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Globe className="h-5 w-5" /></span>
                      <div>
                        <p className="font-semibold text-ink-900">{w.name}</p>
                        {w.domain && <p className="text-xs text-gray-400" dir="ltr">{w.domain}</p>}
                      </div>
                    </div>
                    <StatusBadge status={w.status} locale={locale} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {w.website_url && (
                      <a href={w.website_url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
                        {t("زيارة الموقع", "Visit")} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {w.admin_url && (
                      <a href={`/api/client/sso?website=${w.id}`} target="_blank" rel="noopener noreferrer" className="btn-primary px-3 py-1.5 text-xs">
                        {t("لوحة التحكم", "Dashboard")} <LogOut className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle
              action={
                <Link href={localizePath("/client-portal/notifications", locale)} className="text-sm font-semibold text-brand-600 hover:underline">
                  {t("عرض الكل", "View all")}
                </Link>
              }
            >
              {t("آخر الإشعارات", "Recent Notifications")}
            </SectionTitle>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="card p-6 text-center text-sm text-gray-500">{t("لا توجد إشعارات.", "No notifications.")}</div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="card flex items-start gap-3 p-4">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.is_read ? "bg-gray-200" : "bg-brand-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{localize(locale, n.title_ar, n.title_en)}</p>
                      {n.body_ar && <p className="mt-0.5 text-sm text-gray-500">{localize(locale, n.body_ar, n.body_en)}</p>}
                      <p className="mt-1 text-xs text-gray-400">{formatDate(n.created_at, locale)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <SectionTitle
              action={
                <Link href={localizePath("/client-portal/renewals", locale)} className="text-sm font-semibold text-brand-600 hover:underline">
                  {t("عرض الكل", "View all")}
                </Link>
              }
            >
              {t("طلبات التجديد", "Renewal Requests")}
            </SectionTitle>
            <div className="space-y-3">
              {renewals.length === 0 ? (
                <div className="card p-6 text-center text-sm text-gray-500">{t("لا توجد طلبات تجديد.", "No renewal requests.")}</div>
              ) : (
                renewals.slice(0, 5).map((r) => (
                  <div key={r.id} className="card flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{r.service_name ?? serviceLabel(r.service_type, locale)}</p>
                      <p className="text-xs text-gray-400">{formatDate(r.created_at, locale)}</p>
                    </div>
                    <StatusBadge status={r.status} locale={locale} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function serviceLabel(type: string, locale: "ar" | "en") {
  const map: Record<string, string> = { subscription: locale === "ar" ? "اشتراك" : "Subscription", domain: locale === "ar" ? "دومين" : "Domain", hosting: locale === "ar" ? "استضافة" : "Hosting" };
  return map[type] ?? type;
}
