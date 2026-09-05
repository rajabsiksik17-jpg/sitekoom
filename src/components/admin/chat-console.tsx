"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Send, X, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, Modal, ConfirmDialog } from "@/components/admin/ui";
import { cn, timeAgo } from "@/lib/utils";
import type { LiveChatConversation, LiveChatMessage } from "@/lib/types";

type Agent = { id: string; name: string; avatar_url: string | null; position_ar: string | null; position_en: string | null };

const typeLabels: Record<string, string> = {
  general: "دعم عام",
  modification: "تعديل على الموقع",
  maintenance: "صيانة",
  renewal: "تجديد",
  hosting: "استضافة",
  domain: "دومين",
  development: "تطوير",
  wordpress: "WordPress",
  woocommerce: "WooCommerce",
  other: "أخرى",
};

function appendMessage(prev: LiveChatMessage[], next: LiveChatMessage): LiveChatMessage[] {
  if (prev.some((m) => m.id === next.id)) return prev;
  return [...prev, next].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export function ChatConsole() {
  const { push } = useToast();
  const supabaseRef = useRef(createClient());
  const [tab, setTab] = useState<"waiting" | "active" | "closed">("waiting");
  const [conversations, setConversations] = useState<LiveChatConversation[]>([]);
  const [selected, setSelected] = useState<LiveChatConversation | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [accepting, setAccepting] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LiveChatConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { data } = await supabase.from("live_chat_conversations").select("*").order("created_at", { ascending: false });
    const sorted = [...(data ?? [])].sort((a, b) => {
      const reg = Number(b.is_registered) - Number(a.is_registered);
      if (reg !== 0) return reg;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setConversations(sorted as LiveChatConversation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
    supabaseRef.current.rpc("list_agents").then(({ data }) => setAgents((data ?? []) as Agent[]));

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_conversations" }, () => loadConversations())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selected) return;
    const supabase = supabaseRef.current;

    supabase
      .from("live_chat_messages")
      .select("*")
      .eq("conversation_id", selected.id)
      .order("created_at")
      .then(({ data }) => setMessages((data ?? []) as LiveChatMessage[]));

    const channel = supabase
      .channel(`chat:${selected.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          const msg = payload.new as LiveChatMessage;
          setMessages((prev) => appendMessage(prev, msg));
          if (msg.sender_type === "visitor") {
            supabase.from("live_chat_messages").update({ read_at: new Date().toISOString(), status: "read" }).eq("id", msg.id).then();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_chat_conversations", filter: `id=eq.${selected.id}` },
        (payload) => {
          setSelected((prev) => (prev && prev.id === payload.new.id ? { ...prev, ...(payload.new as LiveChatConversation) } : prev));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected?.id]);

  // Scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function accept(conv: LiveChatConversation) {
    if (accepting) return;
    setAccepting(true);
    try {
      const supabase = supabaseRef.current;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data: me } = await supabase.from("users").select("name,avatar_url,position_ar,position_en").eq("id", uid).single();
      const { error } = await supabase.from("live_chat_conversations").update({
        status: "active",
        assigned_to: uid,
        agent_name: me?.name ?? "Agent",
        agent_avatar: me?.avatar_url ?? null,
        agent_position: me?.position_ar ?? null,
        last_message_at: new Date().toISOString(),
      }).eq("id", conv.id);
      if (error) return push("error", error.message);
      await supabase.from("live_chat_messages").insert({ conversation_id: conv.id, sender_type: "system", body: "تم قبول المحادثة" });
      setTab("active");
      setSelected((prev) => (prev && prev.id === conv.id ? { ...prev, status: "active" } : prev));
    } finally {
      setAccepting(false);
    }
  }

  async function sendMessage() {
    if (!selected || !input.trim() || sending) return;
    if (selected.status === "closed") return push("error", "المحادثة مغلقة ولا يمكن إرسال رسائل");
    setSending(true);
    try {
      const supabase = supabaseRef.current;
      const { error } = await supabase.from("live_chat_messages").insert({ conversation_id: selected.id, sender_type: "agent", body: input.trim() });
      if (error) {
        setSelected((prev) => (prev ? { ...prev, status: "closed", closed_by: "customer" } : prev));
        setInput("");
        push("error", "تم إنهاء هذه المحادثة ولا يمكن إرسال رسائل جديدة.");
        return;
      }
      await supabase.from("live_chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selected.id);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } finally {
      setSending(false);
    }
  }

  function autoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function closeConversation() {
    if (!selected) return;
    setConfirmClose(true);
  }

  async function confirmCloseConversation() {
    if (!selected || closing) return;
    setClosing(true);
    const supabase = supabaseRef.current;
    await supabase.from("live_chat_conversations").update({ status: "closed", closed_at: new Date().toISOString(), closed_by: "admin" }).eq("id", selected.id).neq("status", "closed");
    await supabase.from("live_chat_messages").insert({ conversation_id: selected.id, sender_type: "system", body: "تم إنهاء المحادثة" });
    setClosing(false);
    setConfirmClose(false);
    setSelected(null);
    setMessages([]);
    loadConversations();
  }

  async function transfer(agentId: string) {
    if (!selected || !agentId) return;
    const supabase = supabaseRef.current;
    const agent = agents.find((a) => a.id === agentId);
    await supabase.from("live_chat_conversations").update({
      assigned_to: agentId,
      agent_name: agent?.name ?? null,
      agent_avatar: agent?.avatar_url ?? null,
      agent_position: agent?.position_ar ?? null,
    }).eq("id", selected.id);
    push("success", "تم نقل المحادثة");
    loadConversations();
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    const supabase = supabaseRef.current;
    await supabase.from("live_chat_conversations").update({ status: "closed", closed_at: new Date().toISOString(), closed_by: "admin" }).eq("id", cancelTarget.id).neq("status", "closed");
    await supabase.from("live_chat_messages").insert({ conversation_id: cancelTarget.id, sender_type: "system", body: "تم إلغاء المحادثة" });
    setCancelTarget(null);
    loadConversations();
  }

  const list = conversations.filter((c) => c.status === tab);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="الاتصال المباشر" description="إدارة محادثات العملاء المباشرة." />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["waiting", "active", "closed"] as const).map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); setSelected(null); }} className={cn("shrink-0 rounded-lg px-4 py-2 text-sm font-semibold", tab === t ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {t === "waiting" ? "بالانتظار" : t === "active" ? "نشطة" : "مغلقة"} ({conversations.filter((c) => c.status === t).length})
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Conversation list */}
        <div className={cn("space-y-3", selected && "hidden lg:block")}>
          {list.length === 0 ? (
            <EmptyState title="لا توجد محادثات" />
          ) : (
            list.map((c) => (
              <div key={c.id} role="button" tabIndex={0} onClick={() => { setSelected(c); setMessages([]); }} className={cn("card block w-full cursor-pointer p-4 text-start transition-all", selected?.id === c.id ? "border-brand-400 ring-2 ring-brand-200" : "")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-semibold text-ink-900">{c.visitor_name ?? "زائر"}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at, "ar")}</span>
                    {c.status === "waiting" && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCancelTarget(c); }} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="إلغاء المحادثة"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
                {c.is_registered && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">عميل مسجل</span>
                )}
                {c.conversation_type && (
                  <span className="mt-1.5 ms-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{typeLabels[c.conversation_type] ?? c.conversation_type}</span>
                )}
                <p className="mt-1 truncate text-sm text-gray-500">{c.first_message}</p>
                {c.visitor_email && <p className="mt-1 truncate text-xs text-gray-400" dir="ltr">{c.visitor_email}</p>}
              </div>
            ))
          )}
        </div>

        {/* Chat panel */}
        <div className={cn("lg:col-span-2", !selected && "hidden lg:block")}>
          {!selected ? (
            <EmptyState title="اختر محادثة" description="اختر محادثة من القائمة لعرضها." />
          ) : (
            <div className="card flex h-[calc(100dvh-220px)] min-h-[420px] flex-col overflow-hidden lg:h-[600px]">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 px-3 py-2.5 lg:px-4 lg:py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button type="button" onClick={() => { setSelected(null); setMessages([]); }} className="rounded-lg p-2 text-brand-700 hover:bg-brand-50 lg:hidden" aria-label="العودة للقائمة">
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900">{selected.visitor_name ?? "زائر"}</p>
                    <p className="truncate text-xs text-gray-400" dir="ltr">{selected.visitor_email} {selected.visitor_phone}</p>
                    {selected.offer_title && <p className="mt-0.5 truncate text-xs font-semibold text-brand-700">{selected.offer_title}</p>}
                    {(selected.conversation_type || selected.support_reason) && (
                      <p className="mt-0.5 truncate text-xs font-semibold text-brand-700">
                        {selected.support_reason ? `${typeLabels[selected.conversation_type ?? ""] ?? selected.conversation_type ?? ""} — ${selected.support_reason}` : typeLabels[selected.conversation_type ?? ""] ?? selected.conversation_type}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selected.status === "waiting" && (
                    <button type="button" onClick={() => accept(selected)} disabled={accepting} className="btn-primary px-3 py-2 text-sm disabled:opacity-60">
                      {accepting ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />} قبول المحادثة
                    </button>
                  )}
                  {selected.status === "active" && (
                    <>
                      <select className="input w-36 py-2 text-sm" value={selected.assigned_to ?? ""} onChange={(e) => transfer(e.target.value)}>
                        <option value="">نقل إلى...</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <button type="button" onClick={closeConversation} className="btn-secondary px-3 py-2 text-sm"><X className="h-4 w-4" /> إغلاق</button>
                    </>
                  )}
                  {selected.status === "closed" && (
                    <Badge color="gray">{selected.closed_by === "customer" ? "مغلقة من قبل العميل" : "مغلقة من قبل الأدمن"}</Badge>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender_type === "agent" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm", m.sender_type === "agent" ? "rounded-br-sm bg-brand-gradient text-white" : m.sender_type === "system" ? "bg-gray-100 text-gray-500" : "rounded-bl-sm bg-gray-100 text-ink-900")}>
                      {m.body}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selected.status === "active" && (
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-2 border-t border-brand-100 p-2 lg:p-3">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="input max-h-[140px] min-h-[44px] flex-1 resize-none"
                    placeholder="اكتب رسالتك..."
                    value={input}
                    onChange={autoGrow}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button type="submit" className="btn-primary h-11 w-11 shrink-0 p-0" disabled={sending} aria-label="إرسال">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}

              {selected.status === "closed" && (
                <div className="border-t border-brand-100 p-3 text-center text-xs text-gray-500">
                  المحادثة مغلقة {selected.closed_by === "customer" ? "من قبل العميل" : "من قبل الأدمن"} — لا يمكن إرسال رسائل جديدة.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={confirmClose} onClose={() => setConfirmClose(false)} title="إنهاء المحادثة" size="sm"
        footer={<><button type="button" onClick={() => setConfirmClose(false)} className="btn-secondary px-4 py-2 text-sm">إلغاء</button><button type="button" onClick={confirmCloseConversation} disabled={closing} className="btn-danger px-4 py-2 text-sm">{closing ? <Spinner className="h-4 w-4" /> : "نعم، إنهاء المحادثة"}</button></>}>
        <p className="text-sm text-gray-600">هل أنت متأكد من إنهاء هذه المحادثة؟ بعد إنهائها لن تتمكن من إرسال رسائل جديدة إليها، ويمكن للعميل بدء محادثة جديدة لاحقًا.</p>
      </Modal>

      <ConfirmDialog open={!!cancelTarget} title="إلغاء المحادثة" message="هل أنت متأكد من إلغاء هذه المحادثة؟ لن تبقى كمحادثة جديدة وسيتم تسجيل الإلغاء." onCancel={() => setCancelTarget(null)} onConfirm={confirmCancel} />
    </div>
  );
}
