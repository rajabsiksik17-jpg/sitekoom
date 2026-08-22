"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { cn, formatDateTime } from "@/lib/utils";
import { daysUntil } from "@/lib/renewal-service";

interface RenewalRow {
  id: string;
  client_id: string;
  website_id: string | null;
  subscription_id: string | null;
  service_type: string;
  service_name: string | null;
  amount: number;
  status: string;
  message: string | null;
  duration_months: number | null;
  renewal_duration: string | null;
  created_at: string;
  client?: { name: string; company: string | null } | null;
  website?: { name: string; domain: string | null; website_type: string } | null;
  subscription?: { plan: string | null; expiry_date: string | null } | null;
}

const statusMeta: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  new: { label: "جديد", color: "brand" },
  in_review: { label: "قيد المراجعة", color: "amber" },
  approved: { label: "تمت الموافقة", color: "green" },
  rejected: { label: "مرفوض", color: "red" },
  completed: { label: "مكتمل", color: "gray" },
};

const serviceTypeLabels: Record<string, string> = {
  subscription: "اشتراك",
  domain: "دومين",
  hosting: "استضافة",
};

export function RenewalsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<RenewalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  const load = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("renewal_requests")
      .select("*, client:clients(name, company), website:client_websites(name, domain, website_type), subscription:client_subscriptions(plan, expiry_date)")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as RenewalRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-renewals")
      .on("postgres_changes", { event: "*", schema: "public", table: "renewal_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function doAction(row: RenewalRow, action: "approve" | "reject") {
    setProcessing(row.id);
    const res = await fetch("/api/admin/renewals/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: row.id, action }),
    });
    const data = await res.json();
    setProcessing(null);
    if (!res.ok) return push("error", data.error ?? "فشلت العملية");
    push("success", action === "approve" ? "تمت الموافقة على الطلب وإضافة المدة" : "تم رفض الطلب");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="طلبات التجديد" description="مراجعة طلبات التجديد الواردة من العملاء والموافقة عليها." />

      {items.length === 0 ? (
        <EmptyState title="لا توجد طلبات تجديد" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العميل</th>
                <th className="px-4 py-3 text-start font-semibold">الموقع</th>
                <th className="px-4 py-3 text-start font-semibold">النوع</th>
                <th className="px-4 py-3 text-start font-semibold">المدة</th>
                <th className="px-4 py-3 text-start font-semibold">انتهاء الاشتراك</th>
                <th className="px-4 py-3 text-start font-semibold">متبقي</th>
                <th className="px-4 py-3 text-start font-semibold">القيمة</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((r) => {
                const meta = statusMeta[r.status] ?? statusMeta.new;
                const left = daysUntil(r.subscription?.expiry_date ?? null);
                return (
                  <tr key={r.id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{r.client?.name ?? "—"}</p>
                      {r.client?.company && <p className="text-xs text-gray-400">{r.client.company}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{r.website?.name ?? r.service_name ?? "—"}</p>
                      <p className="text-xs text-gray-400" dir="ltr">{r.website?.domain ?? "—"} · {r.website?.website_type ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{serviceTypeLabels[r.service_type] ?? r.service_type}</td>
                    <td className="px-4 py-3 text-gray-600">{r.renewal_duration ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{r.subscription?.expiry_date ?? "—"}</td>
                    <td className="px-4 py-3">
                      {left === null ? <span className="text-gray-400">—</span> : (
                        <span className={cn("font-semibold", left < 0 ? "text-red-600" : left <= 30 ? "text-amber-600" : "text-green-600")}>
                          {left < 0 ? `منتهي ${Math.abs(left)} يوم` : `${left} يوم`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{Number(r.amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge color={meta.color}>{meta.label}</Badge></td>
                    <td className="px-4 py-3">
                      {(r.status === "new" || r.status === "in_review") ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={processing === r.id} onClick={() => doAction(r, "approve")} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60">
                            <Check className="h-3.5 w-3.5" /> موافقة
                          </button>
                          <button type="button" disabled={processing === r.id} onClick={() => doAction(r, "reject")} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60">
                            <X className="h-3.5 w-3.5" /> رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
