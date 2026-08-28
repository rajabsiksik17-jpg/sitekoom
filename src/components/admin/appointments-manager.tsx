"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type { Appointment, Service } from "@/lib/types";

const STATUS = ["new", "reviewing", "approved", "rejected", "awaiting_client", "rescheduled", "completed", "cancelled"];
const statusMeta: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  new: { label: "جديد", color: "brand" },
  reviewing: { label: "قيد المراجعة", color: "amber" },
  approved: { label: "موافق عليه", color: "green" },
  rejected: { label: "مرفوض", color: "red" },
  awaiting_client: { label: "بانتظار موافقة العميل", color: "amber" },
  rescheduled: { label: "موعد مؤجل", color: "brand" },
  completed: { label: "مكتمل", color: "green" },
  cancelled: { label: "ملغي", color: "gray" },
};

const WORK_DAYS: { value: number; label: string }[] = [
  { value: 0, label: "الأحد" }, { value: 1, label: "الاثنين" }, { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" }, { value: 4, label: "الخميس" }, { value: 5, label: "الجمعة" }, { value: 6, label: "السبت" },
];

const DURATIONS = [30, 60, 90, 120, 180];

type Settings = { work_days: number[]; off_days: string[]; start_time: string; end_time: string; duration_minutes: number };

export function AppointmentsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [tab, setTab] = useState<"requests" | "settings">("requests");

  const [settings, setSettings] = useState<Settings>({ work_days: [0, 1, 2, 3, 4, 5, 6], off_days: [], start_time: "09:00", end_time: "17:00", duration_minutes: 120 });
  const [offDaysText, setOffDaysText] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reschedReason, setReschedReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: appts }, { data: svcs }, { data: st }] = await Promise.all([
      supabase.from("appointments").select("*").order("created_at", { ascending: false }),
      supabase.from("services").select("id,title_ar,title_en").eq("status", "published").order("sort"),
      supabase.from("site_settings").select("value").eq("key", "appointment").single(),
    ]);
    setItems((appts ?? []) as Appointment[]);
    setServices((svcs ?? []) as Service[]);
    const raw = (st?.value ?? {}) as Partial<Settings>;
    setSettings({
      work_days: Array.isArray(raw.work_days) ? raw.work_days : [0, 1, 2, 3, 4, 5, 6],
      off_days: Array.isArray(raw.off_days) ? raw.off_days : [],
      start_time: raw.start_time || "09:00",
      end_time: raw.end_time || "17:00",
      duration_minutes: Number(raw.duration_minutes) || 120,
    });
    setOffDaysText((Array.isArray(raw.off_days) ? raw.off_days : []).join("\n"));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function serviceName(id: string): string {
    return services.find((s) => s.id === id)?.title_ar ?? "";
  }

  async function action(action: "approve" | "reject" | "reschedule", extra?: Record<string, unknown>) {
    if (!selected) return;
    setActing(true);
    try {
      const res = await fetch(`/api/appointments/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "error");
      push("success", "تم تنفيذ الإجراء");
      setRejectOpen(false);
      setReschedOpen(false);
      setRejectReason("");
      setReschedReason("");
      await load();
      setSelected((s) => (s ? { ...s, status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "awaiting_client" } : s));
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الإجراء");
    } finally {
      setActing(false);
    }
  }

  async function setStatus(status: string) {
    if (!selected) return;
    setActing(true);
    try {
      const res = await fetch(`/api/appointments/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", status }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "error");
      push("success", "تم تحديث الحالة");
      await load();
      setSelected((s) => (s ? { ...s, status } : s));
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setActing(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    const supabase = createClient();
    const offDays = offDaysText.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
    const { error } = await supabase.from("site_settings").upsert({ key: "appointment", value: { ...settings, off_days: offDays } });
    setSavingSettings(false);
    if (error) return push("error", error.message);
    push("success", "تم حفظ إعدادات المواعيد");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const list = (filter === "all" ? items : items.filter((i) => i.status === filter));

  if (tab === "settings") {
    return (
      <div>
        <PageTitle title="طلبات حجز موعد" description="إدارة طلبات المواعيد وإعدادات أوقات العمل." />
        <div className="mb-6 flex gap-2">
          <button type="button" onClick={() => setTab("requests")} className="rounded-lg px-3 py-2 text-sm font-semibold bg-brand-50 text-brand-700">الطلبات</button>
          <button type="button" onClick={() => setTab("settings")} className="rounded-lg px-3 py-2 text-sm font-semibold bg-brand-gradient text-white">الإعدادات</button>
        </div>

        <div className="card max-w-2xl space-y-5 p-6">
          <div>
            <p className="mb-2 font-bold text-ink-900">أيام العمل</p>
            <div className="flex flex-wrap gap-2">
              {WORK_DAYS.map((d) => {
                const on = settings.work_days.includes(d.value);
                return (
                  <button key={d.value} type="button" onClick={() => setSettings((s) => ({ ...s, work_days: on ? s.work_days.filter((x) => x !== d.value) : [...s.work_days, d.value] }))} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", on ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{d.label}</button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ساعة بداية الدوام</label>
              <input className="input" dir="ltr" type="time" value={settings.start_time} onChange={(e) => setSettings((s) => ({ ...s, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">ساعة نهاية الدوام</label>
              <input className="input" dir="ltr" type="time" value={settings.end_time} onChange={(e) => setSettings((s) => ({ ...s, end_time: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">مدة الموعد الافتراضية</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button key={d} type="button" onClick={() => setSettings((s) => ({ ...s, duration_minutes: d }))} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", settings.duration_minutes === d ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{d} دقيقة</button>
              ))}
              <input className="input w-28" dir="ltr" type="number" placeholder="مخصص" value={settings.duration_minutes} onChange={(e) => setSettings((s) => ({ ...s, duration_minutes: Number(e.target.value) || 0 }))} />
            </div>
          </div>

          <div>
            <label className="label">أيام العطل (تاريخ لكل سطر YYYY-MM-DD)</label>
            <textarea className="input min-h-[100px] font-mono" dir="ltr" value={offDaysText} onChange={(e) => setOffDaysText(e.target.value)} />
          </div>

          <button type="button" onClick={saveSettings} className="btn-primary px-6 py-2.5" disabled={savingSettings}>{savingSettings ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="طلبات حجز موعد" description="طلبات المواعيد المرسلة من العملاء." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter("all")} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", filter === "all" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>الكل ({items.length})</button>
        {STATUS.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", filter === s ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{statusMeta[s]?.label ?? s} ({items.filter((i) => i.status === s).length})</button>
        ))}
        <button type="button" onClick={() => setTab("settings")} className="ms-auto rounded-lg px-3 py-1.5 text-sm font-semibold bg-ink-900 text-white">الإعدادات</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {list.length === 0 ? <EmptyState title="لا توجد طلبات" /> : list.map((a) => (
            <button key={a.id} type="button" onClick={() => setSelected(a)} className={cn("card block w-full p-4 text-start", selected?.id === a.id ? "border-brand-400 ring-2 ring-brand-200" : "")}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{a.customer_name}</p>
                <Badge color={statusMeta[a.status]?.color ?? "gray"}>{statusMeta[a.status]?.label ?? a.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600" dir="ltr">{a.requested_date} {a.requested_time}</p>
              <p className="mt-1 text-sm text-brand-700">{a.service_ids.map(serviceName).filter(Boolean).join("، ")}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? <EmptyState title="اختر طلبًا" /> : (
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-ink-900">{selected.customer_name}</h3>
                  <p className="text-xs text-gray-500" dir="ltr">{selected.customer_email} — {selected.customer_phone}</p>
                </div>
                <select className="input w-44" value={selected.status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS.map((s) => <option key={s} value={s}>{statusMeta[s]?.label ?? s}</option>)}
                </select>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-gray-500">الخدمات:</span> <b>{selected.service_ids.map(serviceName).filter(Boolean).join("، ") || "—"}</b></div>
                <div><span className="text-gray-500">الموضوع:</span> <b>{selected.subject}</b></div>
                <div><span className="text-gray-500">التاريخ المطلوب:</span> <b dir="ltr">{selected.requested_date}</b></div>
                <div><span className="text-gray-500">الوقت المطلوب:</span> <b dir="ltr">{selected.requested_time}</b></div>
                <div><span className="text-gray-500">المدة:</span> <b>{selected.duration_minutes} دقيقة</b></div>
                <div><span className="text-gray-500">أُرسل في:</span> <b>{new Date(selected.created_at).toLocaleString("ar")}</b></div>
              </div>

              {selected.notes && <p className="rounded-xl bg-brand-50/60 p-3 text-sm text-ink-800">{selected.notes}</p>}
              {selected.reject_reason && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700"><b>سبب الرفض:</b> {selected.reject_reason}</p>}
              {selected.reschedule_reason && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><b>سبب التأجيل:</b> {selected.reschedule_reason}</p>}

              {selected.status === "awaiting_client" && selected.proposed_start_at && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><b>الموعد الجديد المقترح:</b> {new Date(selected.proposed_start_at).toLocaleString("ar")}</p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-brand-100 pt-4">
                {(selected.status === "new" || selected.status === "reviewing") && (
                  <>
                    <button type="button" onClick={() => action("approve")} className="btn-primary px-4 py-2 text-sm" disabled={acting}>موافقة على الموعد</button>
                    <button type="button" onClick={() => setRejectOpen(true)} className="btn-danger px-4 py-2 text-sm" disabled={acting}>رفض</button>
                    <button type="button" onClick={() => setReschedOpen(true)} className="btn-secondary px-4 py-2 text-sm" disabled={acting}>تغيير الموعد</button>
                  </>
                )}
                {selected.status === "approved" && (
                  <button type="button" onClick={() => setReschedOpen(true)} className="btn-secondary px-4 py-2 text-sm" disabled={acting}>تغيير الموعد</button>
                )}
              </div>

              {rejectOpen && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-2 text-sm font-bold text-red-700">سبب الرفض</p>
                  <textarea className="input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => action("reject", { reject_reason: rejectReason })} className="btn-danger px-4 py-2 text-sm" disabled={acting}>تأكيد الرفض</button>
                    <button type="button" onClick={() => setRejectOpen(false)} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
                  </div>
                </div>
              )}

              {reschedOpen && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-bold text-amber-800">موعد جديد مقترح</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="input" dir="ltr" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    <input className="input" dir="ltr" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                  </div>
                  <textarea className="input mt-2" placeholder="سبب التأجيل / ملاحظة" value={reschedReason} onChange={(e) => setReschedReason(e.target.value)} />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => action("reschedule", { new_date: newDate, new_time: newTime, reschedule_reason: reschedReason })} className="btn-primary px-4 py-2 text-sm" disabled={acting || !newDate || !newTime}>إرسال الاقتراح</button>
                    <button type="button" onClick={() => setReschedOpen(false)} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
