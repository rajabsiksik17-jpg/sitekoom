import { getCurrentClient, getClientNotifications } from "@/lib/client-data";
import { SectionTitle } from "@/components/client-portal/bits";
import { NotificationsList } from "@/components/client-portal/notifications-list";

export const dynamic = "force-dynamic";

export default async function ClientNotificationsPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const notifications = await getClientNotifications(client.id);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("الإشعارات", "Notifications")}</SectionTitle>
      <NotificationsList locale={locale} notifications={notifications.map((n) => ({ id: n.id, title: locale === "ar" ? n.title_ar : n.title_en, body: locale === "ar" ? (n.body_ar ?? "") : (n.body_en ?? ""), is_read: n.is_read, created_at: n.created_at }))} />
    </div>
  );
}
