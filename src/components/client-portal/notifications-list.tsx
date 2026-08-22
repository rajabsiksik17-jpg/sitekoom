"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsList({ locale, notifications }: { locale: "ar" | "en"; notifications: NotificationItem[] }) {
  const [items, setItems] = useState(notifications);
  const isAr = locale === "ar";

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch("/api/client/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/client/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  return (
    <div>
      {items.some((n) => !n.is_read) && (
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={markAllRead} className="btn-secondary px-4 py-2 text-sm">
            <CheckCheck className="h-4 w-4" /> {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500">{isAr ? "لا توجد إشعارات." : "No notifications."}</div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.is_read && markRead(n.id)}
              className={cn("card block w-full p-5 text-start transition-colors", !n.is_read ? "border-brand-300 bg-brand-50/40" : "")}
            >
              <div className="flex items-start gap-3">
                <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", n.is_read ? "bg-gray-200" : "bg-brand-500")} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>}
                  <p className="mt-1.5 text-xs text-gray-400">{formatDate(n.created_at, locale)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
