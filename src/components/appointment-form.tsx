"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, CalendarDays, Clock } from "lucide-react";
import { localize, cn } from "@/lib/utils";
import { PhoneInput } from "@/components/phone-input";
import type { Service, DynamicFormField } from "@/lib/types";
import type { AppointmentSettings } from "@/lib/appointments";

function getDeviceId(): string {
  const KEY = "sitekoom_device_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

const INITIAL_SERVICES = 6;

export function AppointmentForm({ services, settings, locale, formFields, successMessage }: {
  services: Service[];
  settings: AppointmentSettings;
  locale: "ar" | "en";
  formFields?: DynamicFormField[];
  successMessage?: string;
}) {
  const isAr = locale === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const cfg = (key: string) => formFields?.find((f) => f.field_key === key);
  const label = (key: string, ar: string, en: string) => {
    const c = cfg(key);
    return localize(locale, c?.label_ar || ar, c?.label_en || en);
  };
  const ph = (key: string, ar: string, en: string) => {
    const c = cfg(key);
    return localize(locale, c?.placeholder_ar || ar, c?.placeholder_en || en);
  };
  // Core fields (name/email/phone) stay required so the booking system never breaks.
  const subjectRequired = cfg("subject") ? cfg("subject")!.required : true;
  const notesRequired = cfg("notes") ? cfg("notes")!.required : false;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [dayOff, setDayOff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const visibleServices = useMemo(() => {
    if (showAllServices) return services;
    return services.slice(0, INITIAL_SERVICES);
  }, [services, showAllServices]);

  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.lead_days || 0));
    return d.toISOString().slice(0, 10);
  }, [settings.lead_days]);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.max_days_ahead || 30));
    return d.toISOString().slice(0, 10);
  }, [settings.max_days_ahead]);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    let active = true;
    setLoadingSlots(true);
    setTime("");
    fetch(`/api/appointments/availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setSlots(d.slots ?? []);
        setDayOff(Boolean(d.dayOff));
      })
      .catch(() => { if (active) setSlots([]); })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [date]);

  function toggleService(id: string) {
    setServiceIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return setError(t("يرجى تعبئة الاسم والبريد والهاتف", "Please fill name, email and phone"));
    if (!serviceIds.length) return setError(t("يرجى اختيار خدمة واحدة على الأقل", "Please select at least one service"));
    if (subjectRequired && !subject.trim()) return setError(t("يرجى كتابة الموضوع", "Please write a subject"));
    if (notesRequired && !notes.trim()) return setError(t("يرجى تعبئة الملاحظات", "Please fill the notes"));
    if (!date || !time) return setError(t("يرجى اختيار التاريخ والوقت", "Please pick a date and time"));

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-device-id": getDeviceId() },
        body: JSON.stringify({ name, email, phone, service_ids: serviceIds, subject, notes, date, time, language: locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="glass-premium rounded-3xl p-8 text-center shadow-card">
        <h3 className="text-xl font-extrabold text-ink-900">{t("تم استلام طلبك", "Your request has been received")}</h3>
        <p className="mt-2 text-gray-600">{successMessage || t("سنراجع طلبك ونؤكد موعدك عبر البريد الإلكتروني.", "We will review your request and confirm your appointment by email.")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-premium space-y-5 rounded-3xl p-6 shadow-card sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{label("name", "الاسم الكامل", "Full name")} *</label>
          <input className="input" dir={isAr ? "rtl" : "ltr"} placeholder={ph("name", "", "")} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">{label("email", "البريد الإلكتروني", "Email")} *</label>
          <input className="input" dir="ltr" type="email" placeholder={ph("email", "", "")} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label">{label("phone", "رقم الهاتف", "Phone")} *</label>
        <PhoneInput label={label("phone", "الهاتف", "Phone")} onChange={(r) => setPhone(r.value?.e164 ?? "")} />
      </div>

      <div>
        <label className="label">{t("الخدمات المطلوبة", "Requested services")} *</label>
        <div className="flex flex-wrap gap-2">
          {visibleServices.map((s) => {
            const active = serviceIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleService(s.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "border-brand-500 bg-brand-gradient text-white" : "border-brand-100 bg-white/70 text-ink-800 hover:border-brand-300",
                )}
              >
                {localize(locale, s.title_ar, s.title_en)}
              </button>
            );
          })}
        </div>
        {services.length > INITIAL_SERVICES && (
          <button type="button" onClick={() => setShowAllServices((v) => !v)} className="mt-2 text-sm font-bold text-brand-700 hover:underline">
            {showAllServices ? t("عرض أقل", "Show less") : t("رؤية المزيد", "See more")}
          </button>
        )}
      </div>

      <div>
        <label className="label">{label("subject", "الموضوع", "Subject")}{subjectRequired && " *"}</label>
        <textarea className="input min-h-[90px] resize-y" dir={isAr ? "rtl" : "ltr"} placeholder={ph("subject", "", "")} value={subject} onChange={(e) => setSubject(e.target.value)} required={subjectRequired} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="label">{t("التاريخ المطلوب", "Requested date")} *</label>
          <input className="input w-full min-w-0" dir="ltr" type="date" min={today} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="min-w-0">
          <label className="label">{t("الوقت المطلوب", "Requested time")} *</label>
          <div className="min-h-[46px]">
            {loadingSlots ? (
              <div className="flex items-center gap-2 rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> {t("جارٍ تحميل الأوقات...", "Loading times...")}</div>
            ) : !date ? (
              <p className="rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-gray-400">{t("اختر التاريخ أولاً", "Pick a date first")}</p>
            ) : dayOff ? (
              <p className="rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-amber-600">{t("هذا اليوم غير متاح للحجز", "This day is not available")}</p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-gray-400">{t("لا توجد أوقات متاحة", "No available times")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button key={s} type="button" onClick={() => setTime(s)} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold transition-colors", time === s ? "border-brand-500 bg-brand-gradient text-white" : "border-brand-100 bg-white/70 text-ink-800 hover:border-brand-300")}>
                    <Clock className="me-1 inline h-3.5 w-3.5" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="label">{label("notes", "ملاحظات إضافية", "Additional notes")}{notesRequired && " *"}</label>
        <textarea className="input min-h-[80px] resize-y" dir={isAr ? "rtl" : "ltr"} placeholder={ph("notes", "", "")} value={notes} onChange={(e) => setNotes(e.target.value)} required={notesRequired} />
      </div>

      <div className="rounded-xl bg-brand-50/60 p-3 text-sm text-ink-700">
        <CalendarDays className="me-1 inline h-4 w-4 text-brand-600" />
        {t(`مدة الموعد: ${settings.duration_minutes} دقيقة`, `Appointment duration: ${settings.duration_minutes} minutes`)}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full px-6 py-3" disabled={sending}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? t("جارٍ الإرسال...", "Sending...") : t("إرسال طلب الحجز", "Submit booking request")}
      </button>
    </form>
  );
}
