"use client";

import { useEffect, useRef, useState } from "react";
import { Headset, LifeBuoy, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  visitor_token: string;
  status: string;
  agent_name: string | null;
  agent_avatar: string | null;
  agent_position: string | null;
}

interface Message {
  id: string;
  sender_type: "visitor" | "agent" | "system";
  body: string;
  created_at: string;
}

export interface ReasonOption {
  value: string;
  label: string;
}

function appendMessage(prev: Message[], next: Message): Message[] {
  if (prev.some((m) => m.id === next.id)) return prev;
  return [...prev, next].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export function SupportChat({ locale, reasons }: { locale: "ar" | "en"; reasons: ReasonOption[] }) {
  const supabaseRef = useRef(createClient());
  const isAr = locale === "ar";
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"form" | "waiting" | "active" | "closed">("form");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setError(isAr ? "اختر سبب التواصل" : "Select a reason");
    if (!message.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, reason, source_page: window.location.pathname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setConversation(data.conversation);
      setPhase("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!conversation) return;
    const supabase = supabaseRef.current;
    supabase
      .from("live_chat_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at")
      .then(({ data }) => setMessages((data ?? []) as Message[]));

    const channel = supabase
      .channel(`client-chat:${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => setMessages((prev) => appendMessage(prev, payload.new as Message)),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_chat_conversations", filter: `id=eq.${conversation.id}` },
        (payload) => {
          const conv = payload.new as Conversation;
          setConversation(conv);
          if (conv.status === "active" || conv.status === "accepted") setPhase("active");
          if (conv.status === "closed") setPhase("closed");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !conversation) return;
    setInput("");
    await supabaseRef.current.from("live_chat_messages").insert({ conversation_id: conversation.id, sender_type: "visitor", body, status: "sent" });
  }

  async function end() {
    if (!conversation) return;
    setConfirmEnd(true);
  }

  async function confirmEndChat() {
    if (!conversation || ending) return;
    setEnding(true);
    await fetch("/api/chat/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitor_token: conversation.visitor_token }) });
    setEnding(false);
    setConfirmEnd(false);
    setPhase("closed");
  }

  function reset() {
    setConversation(null);
    setMessages([]);
    setMessage("");
    setReason("");
    setPhase("form");
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 bg-brand-gradient px-5 py-4 text-white">
        <Headset className="h-5 w-5" />
        <div>
          <p className="text-sm font-bold">{isAr ? "الدعم الفني" : "Technical Support"}</p>
          <p className="text-xs opacity-80">{isAr ? "تحدث مع فريق سايتكم مباشرة" : "Chat with the Sitekoom team"}</p>
        </div>
      </div>

      {phase === "form" && (
        <form onSubmit={start} className="space-y-4 p-6">
          <p className="text-sm font-semibold text-ink-900">{isAr ? "ما سبب تواصلك معنا؟" : "What is the reason for your contact?"}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {reasons.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  reason === r.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-brand-100 text-gray-600 hover:border-brand-300 hover:bg-brand-50/50",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            className="input min-h-[100px]"
            placeholder={isAr ? "اكتب تفاصيل طلبك..." : "Describe your request..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full px-6 py-2.5" disabled={loading}>
            {loading ? (isAr ? "جارٍ البدء..." : "Starting...") : isAr ? "ابدأ المحادثة" : "Start conversation"}
          </button>
        </form>
      )}

      {phase === "waiting" && (
        <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <LifeBuoy className="h-7 w-7 text-brand-700" />
          </span>
          <p className="font-semibold text-ink-900">{isAr ? "بانتظار اتصال أحد موظفي الدعم..." : "Waiting for a support agent..."}</p>
          <button type="button" onClick={end} className="btn-secondary px-4 py-2 text-sm">{isAr ? "إلغاء المحادثة" : "Cancel"}</button>
        </div>
      )}

      {phase === "closed" && (
        <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <p className="font-semibold text-ink-900">{isAr ? "انتهت المحادثة" : "Conversation ended"}</p>
          <button type="button" onClick={reset} className="btn-primary px-5 py-2.5 text-sm">{isAr ? "محادثة جديدة" : "New conversation"}</button>
        </div>
      )}

      {phase === "active" && (
        <>
          <div className="h-[320px] space-y-3 overflow-y-auto p-4">
            {conversation?.agent_name && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 p-2 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-200 font-bold text-brand-800">{conversation.agent_name[0]}</span>
                <div>
                  <p className="text-xs font-bold">{conversation.agent_name}</p>
                  <p className="text-[10px] text-green-600">{isAr ? "متصل" : "Online"}</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.sender_type === "visitor" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.sender_type === "visitor" ? "bg-brand-gradient text-white" : m.sender_type === "system" ? "bg-gray-100 text-gray-500" : "bg-gray-100 text-ink-900")}>
                  {m.body}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-100 p-2 text-center">
            <button type="button" onClick={end} className="text-xs font-medium text-gray-400 hover:text-red-500">{isAr ? "إنهاء المحادثة" : "End conversation"}</button>
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-brand-100 p-3">
            <input className="input flex-1" placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."} value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" className="btn-primary px-3" aria-label="Send"><Send className="h-4 w-4" /></button>
          </form>
        </>
      )}

      {confirmEnd && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink-900">{isAr ? "إنهاء المحادثة" : "End conversation"}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {isAr ? "هل أنت متأكد من إنهاء المحادثة؟ بعد إنهائها لن تتمكن من إرسال رسائل جديدة." : "Are you sure you want to end the conversation? You won't be able to send new messages afterwards."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmEnd(false)} className="btn-secondary px-4 py-2 text-sm">{isAr ? "إلغاء" : "Cancel"}</button>
              <button type="button" onClick={confirmEndChat} disabled={ending} className="btn-danger px-4 py-2 text-sm">
                {ending ? (isAr ? "جارٍ الإنهاء..." : "Ending...") : isAr ? "إنهاء المحادثة" : "End conversation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
