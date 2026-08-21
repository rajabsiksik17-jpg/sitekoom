"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { playNotificationSound } from "@/lib/sound";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data ?? []) as Notification[]));

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev]);
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
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  async function markAllRead() {
    const supabase = supabaseRef.current;
    await supabase.from("notifications").update({ is_read: true }).is("user_id", null);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
                  items.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "#"}
                      onClick={() => setOpen(false)}
                      className={`block border-b border-brand-50 px-4 py-3 hover:bg-brand-50 ${n.is_read ? "opacity-60" : ""}`}
                    >
                      <p className="text-sm font-semibold text-ink-900">{n.title_ar}</p>
                      {n.body_ar && <p className="mt-0.5 text-xs text-gray-500">{n.body_ar}</p>}
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.created_at, "ar")}</p>
                    </Link>
                  ))
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
