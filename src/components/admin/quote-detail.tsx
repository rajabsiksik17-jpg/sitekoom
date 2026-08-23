"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner } from "@/components/admin/ui";
import { pricingStatusLabels } from "@/components/admin/nav";
import { formatDateTime } from "@/lib/utils";
import type { ProjectRequest, ContactNote, User } from "@/lib/types";

const STATUSES = ["new", "reviewing", "contacted", "quotation_sent", "negotiation", "won", "lost", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export function QuoteDetail({ id }: { id: string }) {
  const { push } = useToast();
  const [quote, setQuote] = useState<ProjectRequest | null>(null);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [c, n, u] = await Promise.all([
      supabase.from("project_requests").select("*").eq("id", id).single(),
      supabase.from("project_request_notes").select("*").eq("project_request_id", id).order("created_at", { ascending: false }),
      supabase.from("users").select("*").is("deleted_at", null),
    ]);
    setQuote((c.data as ProjectRequest) ?? null);
    setNotes((n.data ?? []) as ContactNote[]);
    setUsers((u.data ?? []) as User[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function update(field: string, value: string) {
    if (!quote) return;
    const supabase = createClient();
    const { error } = await supabase.from("project_requests").update({ [field]: value }).eq("id", id);
    if (error) return push("error", error.message);
    setQuote((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function addNote() {
    if (!newNote.trim()) return;
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("project_request_notes").insert({
      project_request_id: id, body: newNote.trim(), author_id: userData.user?.id, is_internal: true,
    });
    if (error) return push("error", error.message);
    setNewNote("");
    push("success", "تمت إضافة الملاحظة");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!quote) return <div className="py-16 text-center text-gray-500">الطلب غير موجود</div>;

  const info: [string, string][] = [
    ["الاسم", quote.name],
    ["الشركة", quote.company ?? "—"],
    ["البريد", quote.email ?? "—"],
    ["الهاتف", quote.phone ?? "—"],
    ["الدولة", quote.country ?? "—"],
    ["الخدمة", quote.service_name ?? quote.other_service ?? "—"],
    ["الميزانية", quote.budget ?? "—"],
    ["الموعد", quote.timeline ?? "—"],
    ["المصدر", quote.source ?? "—"],
    ["الصفحة", quote.source_page ?? "—"],
    ["العمل المرتبط", quote.source_work_title ?? "—"],
    ["التاريخ", formatDateTime(quote.created_at, "ar")],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/quotes" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <div className="flex gap-2">
          <select className="input w-40" value={quote.priority} onChange={(e) => update("priority", e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="input w-44" value={quote.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{pricingStatusLabels[s]?.label ?? s}</option>)}
          </select>
          <select className="input w-44" value={quote.assigned_to ?? ""} onChange={(e) => update("assigned_to", e.target.value)}>
            <option value="">غير مُسند</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-ink-900">تفاصيل الطلب</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-gray-400">{k}</dt>
                <dd className="mt-0.5 text-sm text-ink-900" dir="auto">{v}</dd>
              </div>
            ))}
          </dl>

          {quote.other_service && quote.service_name === null && (
            <div className="mt-4 rounded-xl bg-brand-50 p-4">
              <p className="mb-1 text-xs font-semibold text-gray-400">نوع المشروع</p>
              <p className="text-sm text-ink-900">{quote.other_service}</p>
            </div>
          )}

          {quote.project_details && (
            <div className="mt-4 rounded-xl bg-brand-50 p-4">
              <p className="mb-1 text-xs font-semibold text-gray-400">تفاصيل المشروع</p>
              <p className="text-sm leading-relaxed text-ink-900" dir="auto">{quote.project_details}</p>
            </div>
          )}

          {quote.attachments?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-gray-400">المرفقات</p>
              <ul className="space-y-1">
                {quote.attachments.map((a, i) => (
                  <li key={i}><a href={a} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 underline" dir="ltr">{a}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="mb-3 font-bold text-ink-900">الملاحظات الداخلية</h3>
          <div className="space-y-3">
            {notes.length === 0 && <p className="text-sm text-gray-400">لا توجد ملاحظات.</p>}
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-ink-900">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at, "ar")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className="input flex-1" placeholder="أضف ملاحظة..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <button type="button" onClick={addNote} className="btn-primary px-3"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
