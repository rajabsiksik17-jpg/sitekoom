"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headset, MessageCircle, Minus, Send, Volume2, VolumeX, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/providers";
import { Draggable } from "@/components/draggable";
import { PhoneInput, type PhoneInputResult } from "@/components/phone-input";
import { cn, isValidEmail, buildWhatsAppUrl } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { playNotificationSound, getSoundPref, setSoundPref } from "@/lib/sound";
import type { GeneralSettings } from "@/lib/settings";

type Phase = "form" | "waiting" | "active" | "closed";
type View = "closed" | "open" | "minimized";

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

const TOKEN_KEY = "sitekoom_chat_token";

function appendMessage(prev: Message[], next: Message): Message[] {
  if (prev.some((m) => m.id === next.id)) return prev;
  return [...prev, next].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export function FloatingContact({ settings }: { settings: GeneralSettings }) {
  const { locale, dict } = useLocale();
  const supabaseRef = useRef(createClient());

  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<View>("closed");
  const [phase, setPhase] = useState<Phase>("form");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [phone, setPhone] = useState<PhoneInputResult>({ value: null, countryCode: "JO", nationalNumber: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  const viewRef = useRef(view);
  const soundOnRef = useRef(soundOn);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);
  useEffect(() => {
    setSoundOn(getSoundPref());
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const loadConversation = useCallback(
    async (token: string) => {
      const supabase = supabaseRef.current;
      const { data } = await supabase
        .from("live_chat_conversations")
        .select("*")
        .eq("visitor_token", token)
        .single();
      if (!data) return;
      const conv = data as Conversation;
      setConversation(conv);
      if (conv.status === "closed") {
        setPhase("closed");
        setView("closed");
      } else {
        setPhase(conv.status === "active" || conv.status === "accepted" ? "active" : "waiting");
        setView("minimized");
      }
      const { data: msgs } = await supabase
        .from("live_chat_messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at");
      setMessages((msgs ?? []) as Message[]);
    },
    [],
  );

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) loadConversation(token);
  }, [loadConversation]);

  // Single realtime subscription per conversation (cleanup on change/unmount).
  useEffect(() => {
    if (!conversation) return;
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => appendMessage(prev, msg));
          if (msg.sender_type === "agent") {
            if (soundOnRef.current) playNotificationSound();
            if (viewRef.current !== "open") {
              setUnread((u) => u + 1);
              showToast(dict.chat.newMessage);
            }
          }
        },
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
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        setAgentTyping(!!payload?.typing);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setAgentTyping(false), 2500);
      })
      .subscribe((status) => {
        setReconnecting(status !== "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, dict.chat.newMessage, showToast]);

  function resetToForm() {
    localStorage.removeItem(TOKEN_KEY);
    setConversation(null);
    setMessages([]);
    setPhase("form");
    setForm({ name: "", email: "", message: "" });
    setPhone({ value: null, countryCode: "JO", nationalNumber: "" });
    setUnread(0);
  }

  function openChat() {
    trackEvent({ event_type: "live_chat_started" });
    setMenuOpen(false);
    setUnread(0);
    // If the previous conversation is closed (or there is none), start fresh
    // with the entry form instead of showing a stale "closed" screen.
    if (phase === "closed" || !conversation) {
      resetToForm();
    }
    setView("open");
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError(dict.common.required);
    if (form.email && !isValidEmail(form.email)) return setError(dict.common.invalidEmail);
    if (!form.message.trim()) return setError(dict.common.required);
    if (phone.nationalNumber.trim() && !phone.value) return setError("يرجى إدخال رقم هاتف صحيح للدولة المحددة.");

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: phone.value?.e164 ?? "",
          message: form.message,
          source_page: window.location.pathname,
          referrer: document.referrer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      localStorage.setItem(TOKEN_KEY, data.conversation.visitor_token);
      setConversation(data.conversation);
      setPhase("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.form.error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !conversation) return;
    setInput("");
    const supabase = supabaseRef.current;
    await supabase.from("live_chat_messages").insert({
      conversation_id: conversation.id,
      sender_type: "visitor",
      body,
      status: "sent",
    });
    supabase
      .channel(`typing:${conversation.id}`)
      .send({ type: "broadcast", event: "typing", payload: { typing: false } });
  }

  function handleEnd() {
    if (!conversation) return;
    setConfirmEnd(true);
  }

  async function confirmEndChat() {
    if (!conversation || ending) return;
    setEnding(true);
    await fetch("/api/chat/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_token: conversation.visitor_token }),
    });
    setEnding(false);
    setConfirmEnd(false);
    setPhase("closed");
  }

  function startNew() {
    resetToForm();
    setView("open");
  }

  function onTyping() {
    if (!conversation) return;
    supabaseRef.current
      .channel(`typing:${conversation.id}`)
      .send({ type: "broadcast", event: "typing", payload: { typing: true } });
  }

  const dir = locale === "ar" ? "rtl" : "ltr";
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  return (
    <>
      {view === "open" && (
        <ChatWindow
          dir={dir}
          dict={dict}
          phase={phase}
          conversation={conversation}
          messages={messages}
          agentTyping={agentTyping}
          reconnecting={reconnecting}
          input={input}
          soundOn={soundOn}
          submitting={submitting}
          error={error}
          form={form}
          phone={phone}
          setForm={setForm}
          setPhone={setPhone}
          setInput={setInput}
          setError={setError}
          onStart={handleStart}
          onSend={handleSend}
          onEnd={handleEnd}
          onStartNew={startNew}
          onMinimize={() => setView("minimized")}
          onTyping={onTyping}
          onToggleSound={() => {
            setSoundOn((v) => {
              setSoundPref(!v);
              return !v;
            });
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 start-5 z-[80] flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-3 text-sm font-medium text-white shadow-card">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          {toast}
        </div>
      )}

      {confirmEnd && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink-900">{dict.chat.close}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {locale === "ar"
                ? "هل أنت متأكد من إنهاء هذه المحادثة؟ بعد إنهاء المحادثة لن تتمكن من إرسال رسائل جديدة إليها، ويمكنك بدء محادثة جديدة لاحقًا."
                : "Are you sure you want to end this conversation? You won't be able to send new messages afterwards, and you can start a new conversation later."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmEnd(false)} className="btn-secondary px-4 py-2 text-sm">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
              <button type="button" onClick={confirmEndChat} disabled={ending} className="btn-danger px-4 py-2 text-sm">
                {ending ? (locale === "ar" ? "جارٍ الإنهاء..." : "Ending...") : (locale === "ar" ? "نعم، إنهاء المحادثة" : "Yes, end conversation")}
              </button>
            </div>
          </div>
        </div>
      )}

      {(view === "closed" || view === "minimized") && (
        <Draggable storageKey="sitekoom_contact_pos" defaultSide="left">
          <div className="relative flex flex-col items-start gap-2">
            {view === "closed" && menuOpen && (
              <div className="absolute bottom-full start-0 mb-2 flex max-h-[60vh] w-max max-w-[80vw] flex-col gap-2 overflow-y-auto rounded-2xl border border-brand-100 bg-white/95 p-2 shadow-card backdrop-blur">
                {whatsapp && (
                  <a
                    href={buildWhatsAppUrl(settings.whatsapp, settings.whatsapp_message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent({ event_type: "whatsapp_clicked" })}
                    className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {dict.floating.whatsapp}
                  </a>
                )}
                <button
                  type="button"
                  onClick={openChat}
                  className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  <Headset className="h-5 w-5" />
                  {dict.chat.start}
                </button>
              </div>
            )}

            {view === "minimized" ? (
              <button
                type="button"
                onClick={() => {
                  setUnread(0);
                  setView("open");
                }}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform hover:scale-105"
                aria-label={dict.chat.title}
              >
                <MessageCircle className="h-6 w-6" />
                {unread > 0 && (
                  <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-3.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105"
                aria-label={dict.floating.contact}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Headset className="h-5 w-5" />}
                <span className="hidden sm:inline">{dict.floating.contact}</span>
              </button>
            )}
          </div>
        </Draggable>
      )}
    </>
  );
}

function ChatWindow(props: {
  dir: string;
  dict: ReturnType<typeof useLocale>["dict"];
  phase: Phase;
  conversation: Conversation | null;
  messages: Message[];
  agentTyping: boolean;
  reconnecting: boolean;
  input: string;
  soundOn: boolean;
  submitting: boolean;
  error: string;
  form: { name: string; email: string; message: string };
  phone: PhoneInputResult;
  setForm: (f: { name: string; email: string; message: string }) => void;
  setPhone: (p: PhoneInputResult) => void;
  setInput: (v: string) => void;
  setError: (v: string) => void;
  onStart: (e: React.FormEvent) => void;
  onSend: (e: React.FormEvent) => void;
  onEnd: () => void;
  onStartNew: () => void;
  onMinimize: () => void;
  onTyping: () => void;
  onToggleSound: () => void;
}) {
  const {
    dir, dict, phase, conversation, messages, agentTyping, reconnecting, input, soundOn,
    submitting, error, form, phone, setForm, setPhone, setInput, setError,
    onStart, onSend, onEnd, onStartNew, onMinimize, onTyping, onToggleSound,
  } = props;

  return (
    <div
      dir={dir}
      className="fixed bottom-0 start-0 z-[70] flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-card sm:bottom-5 sm:start-5 sm:h-[min(560px,calc(100dvh-6rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-brand-100"
    >
      <div className="flex items-center gap-2 bg-brand-gradient px-4 py-3 text-white">
        <Headset className="h-5 w-5" />
        <div className="flex-1">
          <p className="text-sm font-bold">{dict.chat.title}</p>
          <p className="text-xs opacity-80">
            {phase === "active" && conversation?.agent_name
              ? `${conversation.agent_name} • ${dict.chat.connected}`
              : dict.chat.subtitle}
          </p>
        </div>
        <button type="button" onClick={onToggleSound} className="rounded-lg p-1 hover:bg-white/20" aria-label="sound">
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onMinimize} aria-label="Minimize" className="rounded-lg p-1 hover:bg-white/20">
          <Minus className="h-5 w-5" />
        </button>
      </div>

      {reconnecting && (
        <div className="bg-amber-50 px-4 py-1 text-center text-[11px] font-medium text-amber-700">
          Reconnecting...
        </div>
      )}

      {phase === "form" && (
        <form onSubmit={onStart} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <p className="text-sm text-gray-600">{dict.chat.message}</p>
          <input
            className="input"
            placeholder={dict.chat.name}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input"
            type="email"
            placeholder={dict.chat.email}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PhoneInput
            label={dict.form.phone}
            onChange={setPhone}
            initialCountry={phone.countryCode}
            initialNational={phone.nationalNumber}
          />
          <textarea
            className="input min-h-[80px]"
            placeholder={dict.form.messagePlaceholder}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" className="btn-primary mt-auto px-4 py-3" disabled={submitting}>
            {submitting ? dict.common.sending : dict.chat.send}
          </button>
        </form>
      )}

      {phase === "waiting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-300 opacity-40" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <Headset className="h-6 w-6 text-brand-700" />
            </span>
          </div>
          <p className="font-semibold text-ink-900">{dict.chat.waiting}</p>
          <p className="text-xs text-gray-500">{dict.chat.subtitle}</p>
          <button type="button" onClick={onEnd} className="btn-secondary mt-auto px-4 py-2 text-sm">
            {dict.chat.close}
          </button>
        </div>
      )}

      {phase === "closed" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-semibold text-ink-900">{dict.chat.close}</p>
          <p className="text-xs text-gray-500">{dict.chat.subtitle}</p>
          <button type="button" onClick={onStartNew} className="btn-primary px-5 py-2.5 text-sm">
            {dict.chat.send}
          </button>
        </div>
      )}

      {phase === "active" && (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {conversation?.agent_name && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 p-2">
                {conversation.agent_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={conversation.agent_avatar} alt={conversation.agent_name} className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-800">
                    {conversation.agent_name[0]}
                  </span>
                )}
                <div>
                  <p className="text-xs font-bold">{conversation.agent_name}</p>
                  {conversation.agent_position && (
                    <p className="text-[10px] text-gray-500">{conversation.agent_position}</p>
                  )}
                </div>
                <span className="ms-auto flex items-center gap-1 text-[10px] text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {dict.chat.connected}
                </span>
              </div>
            )}

            {messages.map((m) => {
              const isRtl = dir === "rtl";
              const isVisitor = m.sender_type === "visitor";
              return (
                <div key={m.id} className={cn("flex", isVisitor ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      isVisitor
                        ? cn("bg-brand-gradient text-white", isRtl ? "rounded-bl-sm" : "rounded-br-sm")
                        : m.sender_type === "system"
                          ? "bg-gray-100 text-gray-500"
                          : cn("bg-gray-100 text-ink-900", isRtl ? "rounded-br-sm" : "rounded-bl-sm"),
                    )}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
            {agentTyping && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl bg-gray-100 px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-brand-100 p-2 text-center">
            <button type="button" onClick={onEnd} className="text-xs font-medium text-gray-400 hover:text-red-500">
              {dict.chat.close}
            </button>
          </div>

          <form onSubmit={onSend} className="flex gap-2 border-t border-brand-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              className="input flex-1"
              placeholder={dict.chat.typeMessage}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                onTyping();
              }}
            />
            <button type="submit" className="btn-primary px-3" aria-label={dict.common.send}>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
