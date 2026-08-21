"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { cn, timeAgo } from "@/lib/utils";
import type { LiveChatConversation, LiveChatMessage } from "@/lib/types";

type Agent = { id: string; name: string; avatar_url: string | null; position_ar: string | null; position_en: string | null };

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

  const loadConversations = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { data } = await supabase.from("live_chat_conversations").select("*").order("created_at", { ascending: false });
    setConversations((data ?? []) as LiveChatConversation[]);
    setLoading(false);
  }, []);

  // Single subscription for the conversation list (no message handling here).
  useEffect(() => {
    loadConversations();
    supabaseRef.current.rpc("list_agents").then(({ data }) => setAgents((data ?? []) as Agent[]));

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_chat_conversations" },
        () => loadConversations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  // Single subscription for the selected conversation messages.
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
            supabase
              .from("live_chat_messages")
              .update({ read_at: new Date().toISOString(), status: "read" })
              .eq("id", msg.id)
              .then();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected?.id]);

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
      await supabase.from("live_chat_messages").insert({ conversation_id: selected.id, sender_type: "agent", body: input.trim() });
      await supabase.from("live_chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selected.id);
      setInput("");
    } finally {
      setSending(false);
    }
  }

  async function closeConversation() {
    if (!selected) return;
    const supabase = supabaseRef.current;
    await supabase.from("live_chat_conversations").update({ status: "closed", closed_at: new Date().toISOString(), closed_by: "admin" }).eq("id", selected.id);
    await supabase.from("live_chat_messages").insert({ conversation_id: selected.id, sender_type: "system", body: "تم إنهاء المحادثة" });
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

  const list = conversations.filter((c) => c.status === tab);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="الاتصال المباشر" description="إدارة محادثات العملاء المباشرة." />
      <div className="mb-4 flex gap-2">
        {(["waiting", "active", "closed"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-lg px-4 py-2 text-sm font-semibold", tab === t ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {t === "waiting" ? "بالانتظار" : t === "active" ? "نشطة" : "مغلقة"}
            ({conversations.filter((c) => c.status === t).length})
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {list.length === 0 ? (
            <EmptyState title="لا توجد محادثات" />
          ) : (
            list.map((c) => (
              <button key={c.id} type="button" onClick={() => { setSelected(c); setMessages([]); }} className={cn("card block w-full p-4 text-start transition-all", selected?.id === c.id ? "border-brand-400 ring-2 ring-brand-200" : "")}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{c.visitor_name ?? "زائر"}</p>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at, "ar")}</span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-500">{c.first_message}</p>
                {c.visitor_email && <p className="mt-1 text-xs text-gray-400" dir="ltr">{c.visitor_email}</p>}
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <EmptyState title="اختر محادثة" description="اختر محادثة من القائمة لعرضها." />
          ) : (
            <div className="card flex h-[600px] flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
                <div>
                  <p className="font-bold text-ink-900">{selected.visitor_name ?? "زائر"}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{selected.visitor_email} {selected.visitor_phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === "waiting" && (
                    <button type="button" onClick={() => accept(selected)} disabled={accepting} className="btn-primary px-3 py-2 text-sm disabled:opacity-60">
                      {accepting ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />} قبول المحادثة
                    </button>
                  )}
                  {selected.status === "active" && (
                    <>
                      <select className="input w-40 py-2 text-sm" value={selected.assigned_to ?? ""} onChange={(e) => transfer(e.target.value)}>
                        <option value="">نقل إلى...</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <button type="button" onClick={closeConversation} className="btn-secondary px-3 py-2 text-sm"><X className="h-4 w-4" /> إغلاق</button>
                    </>
                  )}
                  {selected.status === "closed" && (
                    <Badge color="gray">
                      {selected.closed_by === "customer" ? "مغلقة من قبل العميل" : "مغلقة من قبل الأدمن"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender_type === "agent" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.sender_type === "agent" ? "rounded-br-sm bg-brand-gradient text-white" : m.sender_type === "system" ? "bg-gray-100 text-gray-500" : "rounded-bl-sm bg-gray-100 text-ink-900")}>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>

              {selected.status === "active" && (
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 border-t border-brand-100 p-3">
                  <input className="input flex-1" placeholder="اكتب رسالتك..." value={input} onChange={(e) => setInput(e.target.value)} />
                  <button type="submit" className="btn-primary px-3" disabled={sending} aria-label="إرسال"><Send className="h-4 w-4" /></button>
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
    </div>
  );
}
