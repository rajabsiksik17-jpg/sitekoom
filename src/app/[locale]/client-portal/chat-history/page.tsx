import { getCurrentClient, getClientConversations } from "@/lib/client-data";
import { SectionTitle, StatusBadge } from "@/components/client-portal/bits";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientChatHistoryPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const conversations = await getClientConversations(client.id);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("سجل المحادثات", "Chat History")}</SectionTitle>
      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد محادثات سابقة.", "No previous conversations.")}</div>
        ) : (
          conversations.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{c.first_message ?? t("محادثة", "Conversation")}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(c.created_at, locale)}</p>
                </div>
                <StatusBadge status={c.status === "closed" ? "closed" : c.status === "active" ? "active" : "new"} locale={locale} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
