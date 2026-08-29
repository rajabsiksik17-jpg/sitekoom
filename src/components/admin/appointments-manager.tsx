"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, Settings } from "lucide-react";
import type { Appointment, Service } from "@/lib/types";

const STATUS = ["new", "rejected", "rescheduled"];
const statusMeta: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  new: { label: "جديد", color: "brand" },
  rejected: { label: "مرفوض", color: "red" },
  rescheduled: { label: "تغيير موعد", color: "amber" },
  approved: { label: "موافق عليه", color: "green" },
};

const WORK_DAYS: { value: number; label: string }[] = [
  { value: 0, label: "الأحد" }, { value: 1, label: "الاثنين" }, { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" }, { value: 4, label: "الخميس" }, { value: 5, label: "الجمعة" }, { value: 6, label: "السبت" },
];
const DURATIONS = [30, 60, 90, 120, 180];
const DAY_NAMES = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

type Settings = { work_days: number[]; off_days: string[]; start_time: string; end_time: string; duration_minutes: number };

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AppointmentsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"requests" | "calendar" | "history" | "settings">("requests");
  const [statusTab, setStatusTab] = useState<string>("new");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all" | "custom">("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState<string>("all");

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calDay, setCalDay] = useState<string | null>(null);

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
      setSelected((s) => (s ? { ...s, status: d.status ?? s.status } : s));
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الإجراء");
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

  function matchesDateRange(dateStr: string): boolean {
    if (dateRange === "all") return true;
    if (dateRange === "today") return dateStr === toISODate(new Date());
    if (dateRange === "week") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 7 * 86400000);
      const d = new Date(`${dateStr}T00:00:00Z`);
      return d >= start && d < end;
    }
    if (dateRange === "month") {
      const now = new Date();
      const d = new Date(`${dateStr}T00:00:00Z`);
      return d.getUTCFullYear() === now.getFullYear() && d.getUTCMonth() === now.getMonth();
    }
    if (dateRange === "custom") {
      return (!customFrom || dateStr >= customFrom) && (!customTo || dateStr <= customTo);
    }
    return true;
  }

  const requestList = useMemo(() => {
    return items.filter((i) => i.status === statusTab && matchesDateRange(i.requested_date));
  }, [items, statusTab, dateRange, customFrom, customTo]);

  const calendarCells = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(calYear, calMonth, d)));
    return cells;
  }, [calYear, calMonth]);

  const dayAppointments = useMemo(() => {
    if (!calDay) return [];
    return items.filter((i) => i.requested_date === calDay || (i.start_at && i.start_at.slice(0, 10) === calDay));
  }, [calDay, items]);

  const historyList = useMemo(() => {
    return items.filter((i) => {
      if (historyStatus !== "all" && i.status !== historyStatus) return false;
      const q = historyQuery.trim().toLowerCase();
      if (q && !(i.customer_name ?? "").toLowerCase().includes(q) && !(i.customer_phone ?? "").includes(q) && !(i.customer_email ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, historyStatus, historyQuery]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const actionsFor = (a: Appointment) => {
    if (a.status === "new") {
      return (
        <div className="flex flex-wrap gap-2 border-t border-brand-100 pt-4">
          <button type="button" onClick={() => action("approve")} className="btn-primary px-4 py-2 text-sm" disabled={acting}>موافقة على الموعد</button>
          <button type="button" onClick={() => setRejectOpen(true)} className="btn-danger px-4 py-2 text-sm" disabled={acting}>رفض</button>
          <button type="button" onClick={() => setReschedOpen(true)} className="btn-secondary px-4 py-2 text-sm" disabled={acting}>تغيير موعد</button>
        </div>
      );
    }
    if (a.status === "approved" || a.status === "rescheduled") {
      return (
        <div className="flex flex-wrap gap-2 border-t border-brand-100 pt-4">
          <button type="button" onClick={() => setReschedOpen(true)} className="btn-secondary px-4 py-2 text-sm" disabled={acting}>تغيير موعد</button>
        </div>
      );
    }
    return null;
  };

  // ── Settings tab ────────────────────────────────────────────────────────
  if (tab === "settings") {
    return (
      <div>
        <PageTitle title="طلبات حجز موعد" description="إدارة طلبات المواعيد وإعدادات أوقات العمل." />
        <TabBar tab={tab} setTab={setTab} />
        <div className="card max-w-2xl space-y-5 p-6">
          <div>
            <p className="mb-2 font-bold text-ink-900">أيام العمل</p>
            <div className="flex flex-wrap gap-2">
              {WORK_DAYS.map((d) => {
                const on = settings.work_days.includes(d.value);
                return <button key={d.value} type="button" onClick={() => setSettings((s) => ({ ...s, work_days: on ? s.work_days.filter((x) => x !== d.value) : [...s.work_days, d.value] }))} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", on ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{d.label}</button>;
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">ساعة بداية الدوام</label><input className="input" dir="ltr" type="time" value={settings.start_time} onChange={(e) => setSettings((s) => ({ ...s, start_time: e.target.value }))} /></div>
            <div><label className="label">ساعة نهاية الدوام</label><input className="input" dir="ltr" type="time" value={settings.end_time} onChange={(e) => setSettings((s) => ({ ...s, end_time: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label">مدة الموعد الافتراضية</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => <button key={d} type="button" onClick={() => setSettings((s) => ({ ...s, duration_minutes: d }))} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", settings.duration_minutes === d ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{d} دقيقة</button>)}
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

  // ── Calendar tab ────────────────────────────────────────────────────────
  if (tab === "calendar") {
    return (
      <div>
        <PageTitle title="تقويم المواعيد" description="عرض المواعيد حسب الشهر." />
        <TabBar tab={tab} setTab={setTab} />
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); }} className="btn-secondary h-9 w-9 p-0"><ChevronRight className="h-4 w-4" /></button>
            <p className="text-lg font-bold text-ink-900">{new Date(calYear, calMonth, 1).toLocaleDateString("ar", { month: "long", year: "numeric" })}</p>
            <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); }} className="btn-secondary h-9 w-9 p-0"><ChevronLeft className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_NAMES.map((d) => <div key={d} className="py-1 text-xs font-semibold text-gray-500">{d}</div>)}
            {calendarCells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />;
              const count = items.filter((it) => it.requested_date === dateStr || (it.start_at && it.start_at.slice(0, 10) === dateStr)).length;
              const isSelected = calDay === dateStr;
              const today = toISODate(new Date()) === dateStr;
              return (
                <button key={i} type="button" onClick={() => setCalDay(isSelected ? null : dateStr)} className={cn("relative flex h-12 flex-col items-center justify-center rounded-lg text-sm transition-colors", isSelected ? "bg-brand-600 text-white" : today ? "bg-brand-50 text-brand-700" : "text-ink-800 hover:bg-brand-50")}>
                  {Number(dateStr.slice(8, 10))}
                  {count > 0 && <span className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-brand-500")} />}
                </button>
              );
            })}
          </div>

          {calDay && (
            <div className="mt-6 border-t border-brand-100 pt-4">
              <p className="mb-3 font-bold text-ink-900">مواعيد {calDay}</p>
              {dayAppointments.length === 0 ? <p className="text-sm text-gray-400">لا توجد مواعيد في هذا اليوم.</p> : (
                <div className="space-y-2">
                  {dayAppointments.map((a) => (
                    <button key={a.id} type="button" onClick={() => setSelected(a)} className="card block w-full p-3 text-start hover:border-brand-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink-900">{a.customer_name}</span>
                        <Badge color={statusMeta[a.status]?.color ?? "gray"}>{statusMeta[a.status]?.label ?? a.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600" dir="ltr">{a.requested_date} {String(a.requested_time).slice(0, 5)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-6">
            <AppointmentDetail a={selected} services={services} statusMeta={statusMeta} actionsFor={actionsFor} acting={acting} onClose={() => setSelected(null)} rejectOpen={rejectOpen} setRejectOpen={setRejectOpen} rejectReason={rejectReason} setRejectReason={setRejectReason} reschedOpen={reschedOpen} setReschedOpen={setReschedOpen} newDate={newDate} setNewDate={setNewDate} newTime={newTime} setNewTime={setNewTime} reschedReason={reschedReason} setReschedReason={setReschedReason} onAction={action} />
          </div>
        )}
      </div>
    );
  }

  // ── History tab ─────────────────────────────────────────────────────────
  if (tab === "history") {
    return (
      <div>
        <PageTitle title="جميع المواعيد" description="سجل كامل لجميع طلبات المواعيد." />
        <TabBar tab={tab} setTab={setTab} />
        <div className="mb-4 flex flex-wrap gap-3">
          <input className="input max-w-xs" placeholder="بحث بالاسم / الهاتف / البريد" value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} />
          <select className="input w-40" value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)}>
            <option value="all">كل الحالات</option>
            {STATUS.map((s) => <option key={s} value={s}>{statusMeta[s]?.label ?? s}</option>)}
            <option value="approved">موافق عليه</option>
          </select>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-start text-gray-500">
                <th className="p-3 text-start">العميل</th>
                <th className="p-3 text-start">الهاتف</th>
                <th className="p-3 text-start">البريد</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">الوقت</th>
                <th className="p-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">لا توجد مواعيد.</td></tr>
              ) : historyList.map((a) => (
                <tr key={a.id} className="cursor-pointer border-b border-brand-50 hover:bg-brand-50/50" onClick={() => setSelected(a)}>
                  <td className="p-3 font-semibold text-ink-900">{a.customer_name}</td>
                  <td className="p-3" dir="ltr">{a.customer_phone}</td>
                  <td className="p-3" dir="ltr">{a.customer_email}</td>
                  <td className="p-3" dir="ltr">{a.requested_date}</td>
                  <td className="p-3" dir="ltr">{String(a.requested_time).slice(0, 5)}</td>
                  <td className="p-3"><Badge color={statusMeta[a.status]?.color ?? "gray"}>{statusMeta[a.status]?.label ?? a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="mt-6">
            <AppointmentDetail a={selected} services={services} statusMeta={statusMeta} actionsFor={actionsFor} acting={acting} onClose={() => setSelected(null)} rejectOpen={rejectOpen} setRejectOpen={setRejectOpen} rejectReason={rejectReason} setRejectReason={setRejectReason} reschedOpen={reschedOpen} setReschedOpen={setReschedOpen} newDate={newDate} setNewDate={setNewDate} newTime={newTime} setNewTime={setNewTime} reschedReason={reschedReason} setReschedReason={setReschedReason} onAction={action} />
          </div>
        )}
      </div>
    );
  }

  // ── Requests tab (default) ──────────────────────────────────────────────
  return (
    <div>
      <PageTitle title="طلبات حجز موعد" description="طلبات المواعيد المرسلة من العملاء." />
      <TabBar tab={tab} setTab={setTab} />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS.map((s) => (
          <button key={s} type="button" onClick={() => setStatusTab(s)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", statusTab === s ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {statusMeta[s]?.label ?? s} ({items.filter((i) => i.status === s).length})
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["today", "week", "month", "all", "custom"] as const).map((r) => (
          <button key={r} type="button" onClick={() => setDateRange(r)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", dateRange === r ? "bg-ink-900 text-white" : "bg-white text-ink-700 border border-brand-100")}>
            {r === "today" ? "اليوم" : r === "week" ? "الأسبوع" : r === "month" ? "الشهر" : r === "all" ? "الكل" : "مخصص"}
          </button>
        ))}
        {dateRange === "custom" && (
          <>
            <input className="input w-36" dir="ltr" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <input className="input w-36" dir="ltr" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {requestList.length === 0 ? <EmptyState title="لا توجد طلبات" /> : requestList.map((a) => (
            <button key={a.id} type="button" onClick={() => setSelected(a)} className={cn("card block w-full p-4 text-start", selected?.id === a.id ? "border-brand-400 ring-2 ring-brand-200" : "", a.status === "new" && "bg-brand-50/40")}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{a.customer_name}</p>
                <Badge color={statusMeta[a.status]?.color ?? "gray"}>{statusMeta[a.status]?.label ?? a.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600" dir="ltr">{a.requested_date} {String(a.requested_time).slice(0, 5)}</p>
              <p className="mt-1 text-sm text-brand-700">{a.service_ids.map(serviceName).filter(Boolean).join("، ")}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? <EmptyState title="اختر طلبًا" /> : (
            <AppointmentDetail a={selected} services={services} statusMeta={statusMeta} actionsFor={actionsFor} acting={acting} onClose={() => setSelected(null)} rejectOpen={rejectOpen} setRejectOpen={setRejectOpen} rejectReason={rejectReason} setRejectReason={setRejectReason} reschedOpen={reschedOpen} setReschedOpen={setReschedOpen} newDate={newDate} setNewDate={setNewDate} newTime={newTime} setNewTime={setNewTime} reschedReason={reschedReason} setReschedReason={setReschedReason} onAction={action} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: string; setTab: (t: "requests" | "calendar" | "history" | "settings") => void }) {
  const tabs: { key: "requests" | "calendar" | "history" | "settings"; label: string; icon?: React.ReactNode }[] = [
    { key: "requests", label: "الطلبات" },
    { key: "calendar", label: "التقويم", icon: <CalendarDays className="h-4 w-4" /> },
    { key: "history", label: "جميع المواعيد" },
    { key: "settings", label: "الإعدادات", icon: <Settings className="h-4 w-4" /> },
  ];
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold", tab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

function AppointmentDetail({ a, services, statusMeta, actionsFor, acting, onClose, rejectOpen, setRejectOpen, rejectReason, setRejectReason, reschedOpen, setReschedOpen, newDate, setNewDate, newTime, setNewTime, reschedReason, setReschedReason, onAction }: {
  a: Appointment;
  services: Service[];
  statusMeta: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }>;
  actionsFor: (a: Appointment) => React.ReactNode;
  acting: boolean;
  onClose: () => void;
  rejectOpen: boolean; setRejectOpen: (v: boolean) => void; rejectReason: string; setRejectReason: (v: string) => void;
  reschedOpen: boolean; setReschedOpen: (v: boolean) => void; newDate: string; setNewDate: (v: string) => void; newTime: string; setNewTime: (v: string) => void; reschedReason: string; setReschedReason: (v: string) => void;
  onAction: (action: "approve" | "reject" | "reschedule", extra?: Record<string, unknown>) => void;
}) {
  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-ink-900">{a.customer_name}</h3>
          <p className="text-xs text-gray-500" dir="ltr">{a.customer_email} — {a.customer_phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={statusMeta[a.status]?.color ?? "gray"}>{statusMeta[a.status]?.label ?? a.status}</Badge>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-ink-900">✕</button>
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div><span className="text-gray-500">الخدمات:</span> <b>{a.service_ids.map((id) => services.find((s) => s.id === id)?.title_ar ?? "").filter(Boolean).join("، ") || "—"}</b></div>
        <div><span className="text-gray-500">الموضوع:</span> <b>{a.subject}</b></div>
        <div><span className="text-gray-500">التاريخ المطلوب:</span> <b dir="ltr">{a.requested_date}</b></div>
        <div><span className="text-gray-500">الوقت المطلوب:</span> <b dir="ltr">{String(a.requested_time).slice(0, 5)}</b></div>
        <div><span className="text-gray-500">المدة:</span> <b>{a.duration_minutes} دقيقة</b></div>
        <div><span className="text-gray-500">أُرسل في:</span> <b>{new Date(a.created_at).toLocaleString("ar")}</b></div>
      </div>

      {a.notes && <p className="rounded-xl bg-brand-50/60 p-3 text-sm text-ink-800">{a.notes}</p>}
      {a.reject_reason && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700"><b>سبب الرفض:</b> {a.reject_reason}</p>}
      {a.reschedule_reason && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><b>سبب التأجيل:</b> {a.reschedule_reason}</p>}

      {actionsFor(a)}

      {rejectOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-bold text-red-700">سبب الرفض</p>
          <textarea className="input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => onAction("reject", { reject_reason: rejectReason })} className="btn-danger px-4 py-2 text-sm" disabled={acting}>تأكيد الرفض</button>
            <button type="button" onClick={() => setRejectOpen(false)} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {reschedOpen && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-bold text-amber-800">موعد جديد</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" dir="ltr" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <input className="input" dir="ltr" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
          <textarea className="input mt-2" placeholder="سبب تغيير الموعد (إلزامي)" value={reschedReason} onChange={(e) => setReschedReason(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => onAction("reschedule", { new_date: newDate, new_time: newTime, reschedule_reason: reschedReason })} className="btn-primary px-4 py-2 text-sm" disabled={acting || !newDate || !newTime || !reschedReason.trim()}>إرسال الموعد الجديد</button>
            <button type="button" onClick={() => setReschedOpen(false)} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
