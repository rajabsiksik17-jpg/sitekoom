"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, User, MessageSquare, Inbox, ReceiptText, RefreshCcw, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { playNotificationSound } from "@/lib/sound";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  chat: MessageSquare,
  contact: Inbox,
  quote: ReceiptText,
  renewal: RefreshCcw,
};
const typeColor: Record<string, string> = {
  chat: "bg-brand-50 text-brand-700",
  contact: "bg-green-50 text-green-700",
  quote: "bg-amber-50 text-amber-700",
  renewal: "bg-blue-50 text-blue-700",
};

function merge(prev: Notification[], next: Notification): Notification[] {
  if (prev.some((n) => n.id === next.id)) return prev;
  return [next, ...prev];
}

export function Topbar() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data ?? []) as Notification[]));

    channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setItems((prev) => merge(prev, payload.new as Notification));
          setPulse(true);
          playNotificationSound();
          setTimeout(() => setPulse(false), 1500);
        },
      )
      .subscribe();

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);

    return () => {
      if (channel) supabase.removeChannel(channel);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  async function markAllRead() {
    const supabase = supabaseRef.current;
    await supabase.from("notifications").update({ is_read: true }).is("user_id", null);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function openItem(n: Notification) {
    setOpen(false);
    if (!n.is_read) {
      const supabase = supabaseRef.current;
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-brand-100 bg-white px-6">
      <p className="text-sm font-semibold text-gray-500">Sitekoom Admin</p>
      <div className="flex items-center gap-3">
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 text-gray-600 hover:bg-brand-50",
              pulse && "animate-pulse text-brand-600",
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute end-0 top-12 w-80 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
                <p className="font-bold text-ink-900">الإشعارات</p>
                {unread > 0 && (
                  <button type="button" onClick={markAllRead} className="text-xs font-semibold text-brand-600 hover:underline">
                    تعليم الكل كمقروء
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-400">لا توجد إشعارات</p>
                ) : (
                  items.map((n) => {
                    const Icon = typeIcon[n.type] ?? Info;
                    return (
                      <Link
                        key={n.id}
                        href={n.link ?? "#"}
                        onClick={() => openItem(n)}
                        className={`flex items-start gap-3 border-b border-brand-50 px-4 py-3 hover:bg-brand-50 ${n.is_read ? "opacity-60" : ""}`}
                      >
                        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", typeColor[n.type] ?? "bg-gray-100 text-gray-600")}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink-900">{n.title_ar}</p>
                          {n.body_ar && <p className="mt-0.5 truncate text-xs text-gray-500">{n.body_ar}</p>}
                          <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.created_at, "ar")}</p>
                        </div>
                        {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <Link href="/admin/profile" className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 text-gray-600 hover:bg-brand-50" aria-label="Profile">
          <User className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
