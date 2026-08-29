"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search, Trash2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState, ConfirmDialog } from "@/components/admin/ui";
import { EmailComposer } from "@/components/admin/email-composer";
import { pricingStatusLabels } from "@/components/admin/nav";
import { formatDateTime } from "@/lib/utils";
import type { ProjectRequest } from "@/lib/types";

const STATUSES = ["new", "reviewing", "contacted", "quotation_sent", "negotiation", "won", "lost", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export function QuotesManager() {
  const { push } = useToast();
  const [items, setItems] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState<ProjectRequest | null>(null);
  const [emailTarget, setEmailTarget] = useState<ProjectRequest | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("project_requests").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    setItems((data ?? []) as ProjectRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !(`${c.name} ${c.email ?? ""} ${c.company ?? ""} ${c.service_name ?? ""} ${c.other_service ?? ""}`.toLowerCase().includes(q))) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }, [items, query, status]);

  async function updateStatus(id: string, value: string) {
    const supabase = createClient();
    const { error } = await supabase.from("project_requests").update({ status: value }).eq("id", id);
    if (error) return push("error", error.message);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("project_requests").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  function exportCsv() {
    const headers = ["الاسم", "البريد", "الهاتف", "الشركة", "الخدمة", "الميزانية", "الموعد", "الحالة", "التاريخ"];
    const rows = filtered.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.company ?? "", c.service_name ?? c.other_service ?? "", c.budget ?? "", c.timeline ?? "", c.status, c.created_at]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="طلبات التسعير" description="طلبات المشاريع وعروض الأسعار."
        action={<button type="button" onClick={exportCsv} className="btn-secondary px-4 py-2.5"><Download className="h-4 w-4" /> تصدير CSV</button>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input className="input ps-10" placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => <option key={s} value={s}>{pricingStatusLabels[s]?.label ?? s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد طلبات تسعير حتى الآن" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                <th className="px-4 py-3 text-start font-semibold">الخدمة</th>
                <th className="px-4 py-3 text-start font-semibold">الميزانية</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotes/${c.id}`} className="font-medium text-ink-900 hover:text-brand-700">{c.name}</Link>
                    <p className="text-xs text-gray-400" dir="ltr">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.service_name ?? c.other_service ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.budget ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select className="rounded-lg border border-brand-100 px-2 py-1 text-xs" value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{pricingStatusLabels[s]?.label ?? s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(c.created_at, "ar")}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {c.email && (
                        <button type="button" onClick={() => setEmailTarget(c)} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                          <Mail className="h-3.5 w-3.5" /> إرسال إيميل
                        </button>
                      )}
                      <button type="button" onClick={() => setDeleting(c)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف الطلب" message="هل أنت متأكد من الحذف؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />

      {emailTarget && (
        <EmailComposer
          open={!!emailTarget}
          onClose={() => setEmailTarget(null)}
          recipientEmail={emailTarget.email ?? ""}
          recipientName={emailTarget.name}
          defaultSubject={emailTarget.service_name ?? emailTarget.other_service ? `بخصوص: ${emailTarget.service_name ?? emailTarget.other_service}` : "بخصوص طلبك"}
          entityType="quote"
          entityId={emailTarget.id}
          onSent={load}
        />
      )}
    </div>
  );
}
