import { getCurrentClient, getClientConversations, getClientConversationMessages } from "@/lib/client-data";
import { getSupportReasons } from "@/lib/support-reasons";
import { SectionTitle, StatusBadge } from "@/components/client-portal/bits";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: "دعم عام", en: "General support" },
  modification: { ar: "تعديل على الموقع", en: "Website modification" },
  maintenance: { ar: "صيانة", en: "Maintenance" },
  renewal: { ar: "تجديد", en: "Renewal" },
  hosting: { ar: "استضافة", en: "Hosting" },
  domain: { ar: "دومين", en: "Domain" },
  development: { ar: "تطوير", en: "Development" },
  wordpress: { ar: "WordPress", en: "WordPress" },
  woocommerce: { ar: "WooCommerce", en: "WooCommerce" },
  other: { ar: "أخرى", en: "Other" },
};

export default async function ClientChatHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const client = await getCurrentClient(locale);
  const [conversations, messages, reasons] = await Promise.all([
    getClientConversations(client.id),
    getClientConversationMessages(client.id),
    getSupportReasons(),
  ]);
  const reasonMap = new Map(reasons.map((r) => [r.value, r]));
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("سجل المحادثات", "Chat History")}</SectionTitle>
      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد محادثات سابقة.", "No previous conversations.")}</div>
        ) : (
          conversations.map((c) => {
            const msgs = messages.get(c.id) ?? [];
            const reason = c.support_reason ? reasonMap.get(c.support_reason) : undefined;
            const typeLabel = c.conversation_type ? typeLabels[c.conversation_type] : undefined;
            return (
              <details key={c.id} className="card group overflow-hidden">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900">{c.first_message ?? t("محادثة", "Conversation")}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{formatDateTime(c.created_at, locale)}</span>
                      {typeLabel && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">{locale === "ar" ? typeLabel.ar : typeLabel.en}</span>}
                      {reason && <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{locale === "ar" ? reason.ar : reason.en}</span>}
                      {c.agent_name && <span>{t("الموظف:", "Agent:")} {c.agent_name}</span>}
                    </div>
                  </div>
                  <StatusBadge status={c.status === "closed" ? "closed" : c.status === "active" ? "active" : "new"} locale={locale} />
                </summary>
                <div className="border-t border-brand-50 p-5">
                  {msgs.length === 0 ? (
                    <p className="text-sm text-gray-400">{t("لا توجد رسائل.", "No messages.")}</p>
                  ) : (
                    <div className="space-y-3">
                      {msgs.map((m) => (
                        <div key={m.id} className={`flex ${m.sender_type === "visitor" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                              m.sender_type === "visitor"
                                ? "bg-brand-gradient text-white"
                                : m.sender_type === "system"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-gray-100 text-ink-900"
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.status === "closed" && (
                    <p className="mt-4 text-center text-xs text-gray-400">{t("هذه المحادثة مغلقة (للقراءة فقط).", "This conversation is closed (read only).")}</p>
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
