"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner } from "@/components/admin/ui";
import { statusLabels, priorityLabels } from "@/components/admin/nav";
import { formatDateTime } from "@/lib/utils";
import type { ContactRequest, ContactNote, User } from "@/lib/types";

const STATUSES = ["new", "contacted", "in_progress", "converted", "closed", "spam"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export function ContactDetail({ id }: { id: string }) {
  const { push } = useToast();
  const [contact, setContact] = useState<ContactRequest | null>(null);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [c, n, u] = await Promise.all([
      supabase.from("contact_requests").select("*").eq("id", id).single(),
      supabase.from("contact_notes").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
      supabase.from("users").select("*").is("deleted_at", null),
    ]);
    setContact((c.data as ContactRequest) ?? null);
    setNotes((n.data ?? []) as ContactNote[]);
    setUsers((u.data ?? []) as User[]);
    setLoading(false);
    // Auto-mark as read when opened (only if still "new").
    if (c.data?.status === "new") {
      supabase.from("contact_requests").update({ status: "contacted" }).eq("id", id).then(() => {
        setContact((prev) => (prev ? { ...prev, status: "contacted" } : prev));
      });
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function update(field: string, value: string) {
    if (!contact) return;
    const supabase = createClient();
    const { error } = await supabase.from("contact_requests").update({ [field]: value }).eq("id", id);
    if (error) return push("error", error.message);
    setContact((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function addNote() {
    if (!newNote.trim()) return;
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("contact_notes").insert({
      contact_id: id, body: newNote.trim(), author_id: userData.user?.id, is_internal: true,
    });
    if (error) return push("error", error.message);
    setNewNote("");
    push("success", "تمت إضافة الملاحظة");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!contact) return <EmptyState title="الطلب غير موجود" />;

  const info: [string, string][] = [
    ["الاسم", contact.name],
    ["الشركة", contact.company ?? "—"],
    ["البريد", contact.email ?? "—"],
    ["الهاتف", contact.phone ?? "—"],
    ["الدولة", contact.country ?? "—"],
    ["سبب التواصل", contact.reason ?? "—"],
    ["الخدمة", contact.service_name ?? "—"],
    ["الميزانية", contact.budget ?? "—"],
    ["المصدر", contact.source ?? "—"],
    ["الصفحة", contact.source_page ?? "—"],
    ["المُحيل (Referrer)", contact.referrer ?? "—"],
    ["UTM Source", contact.utm_source ?? "—"],
    ["UTM Medium", contact.utm_medium ?? "—"],
    ["UTM Campaign", contact.utm_campaign ?? "—"],
    ["نوع الجهاز", contact.device_type ?? "—"],
    ["التاريخ والوقت", formatDateTime(contact.created_at, "ar")],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/contacts" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <div className="flex gap-2">
          <select className="input w-40" value={contact.priority} onChange={(e) => update("priority", e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabels[p]?.label ?? p}</option>)}
          </select>
          <select className="input w-40" value={contact.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]?.label ?? s}</option>)}
          </select>
          <select className="input w-44" value={contact.assigned_to ?? ""} onChange={(e) => update("assigned_to", e.target.value)}>
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
          {contact.message && (
            <div className="mt-6 rounded-xl bg-brand-50 p-4">
              <p className="mb-1 text-xs font-semibold text-gray-400">الرسالة</p>
              <p className="text-sm leading-relaxed text-ink-900" dir="auto">{contact.message}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
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
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return <div className="py-16 text-center text-gray-500">{title}</div>;
}
