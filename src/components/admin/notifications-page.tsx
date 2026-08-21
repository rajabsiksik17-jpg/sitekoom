"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    load();
  }

  async function markAll() {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).is("user_id", null);
    push("success", "تم تعليم الكل كمقروء");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="الإشعارات" action={<button type="button" onClick={markAll} className="btn-secondary px-4 py-2.5 text-sm"><CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد إشعارات" />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className={`card flex items-start gap-3 p-4 ${n.is_read ? "opacity-60" : ""}`}>
              <Badge color={n.type === "chat" ? "brand" : n.type === "contact" ? "green" : "gray"}>{n.type}</Badge>
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{n.title_ar}</p>
                {n.body_ar && <p className="text-sm text-gray-600">{n.body_ar}</p>}
                <p className="mt-1 text-xs text-gray-400">{timeAgo(n.created_at, "ar")}</p>
              </div>
              {!n.is_read && (
                <button type="button" onClick={() => markRead(n.id)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Check className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
