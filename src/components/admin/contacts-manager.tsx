"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog } from "@/components/admin/ui";
import { statusLabels, priorityLabels } from "@/components/admin/nav";
import { formatDateTime } from "@/lib/utils";
import type { ContactRequest } from "@/lib/types";

const STATUSES = ["new", "contacted", "in_progress", "converted", "closed", "spam"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export function ContactsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [deleting, setDeleting] = useState<ContactRequest | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("contact_requests").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    setItems((data ?? []) as ContactRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !(`${c.name} ${c.email ?? ""} ${c.phone ?? ""} ${c.company ?? ""} ${c.service_name ?? ""}`.toLowerCase().includes(q))) return false;
      if (status && c.status !== status) return false;
      if (priority && c.priority !== priority) return false;
      return true;
    });
  }, [items, query, status, priority]);

  async function updateItem(id: string, field: string, value: string) {
    const supabase = createClient();
    const { error } = await supabase.from("contact_requests").update({ [field]: value }).eq("id", id);
    if (error) return push("error", error.message);
    load();
  }

  async function markRead(c: ContactRequest) {
    if (c.status !== "new") return;
    const supabase = createClient();
    const { error } = await supabase.from("contact_requests").update({ status: "contacted" }).eq("id", c.id);
    if (error) return push("error", error.message);
    push("success", "تم تعيين الطلب كمقروء");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("contact_requests").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  function exportCsv() {
    const headers = ["الاسم", "البريد", "الهاتف", "الشركة", "الخدمة", "المصدر", "الحالة", "الأولوية", "التاريخ"];
    const rows = filtered.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.company ?? "", c.service_name ?? "", c.source ?? "", c.status, c.priority, c.created_at]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contact-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="طلبات التواصل" description="إدارة العملاء المحتملين."
        action={<button type="button" onClick={exportCsv} className="btn-secondary px-4 py-2.5"><Download className="h-4 w-4" /> تصدير CSV</button>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input className="input ps-10" placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]?.label ?? s}</option>)}
        </select>
        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">كل الأولويات</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabels[p]?.label ?? p}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد طلبات تواصل حتى الآن" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">الاسم</th>
                <th className="px-4 py-3 text-start font-semibold">الخدمة</th>
                <th className="px-4 py-3 text-start font-semibold">المصدر</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">الأولوية</th>
                <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/contacts/${c.id}`} className="font-medium text-ink-900 hover:text-brand-700">{c.name}</Link>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.service_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.source}</td>
                  <td className="px-4 py-3">
                    <select className="rounded-lg border border-brand-100 px-2 py-1 text-xs" value={c.status} onChange={(e) => updateItem(c.id, "status", e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]?.label ?? s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select className="rounded-lg border border-brand-100 px-2 py-1 text-xs" value={c.priority} onChange={(e) => updateItem(c.id, "priority", e.target.value)}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabels[p]?.label ?? p}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(c.created_at, "ar")}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {c.status === "new" && (
                        <button type="button" onClick={() => markRead(c)} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                          <Check className="h-3.5 w-3.5" /> تعيين كمقروء
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
    </div>
  );
}
