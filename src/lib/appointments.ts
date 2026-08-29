import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface AppointmentSettings {
  work_days: number[]; // 0 = Sunday ... 6 = Saturday
  off_days: string[]; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  duration_minutes: number;
  lead_days: number;
  max_days_ahead: number;
}

export const appointmentDefaults: AppointmentSettings = {
  work_days: [0, 1, 2, 3, 4, 5, 6],
  off_days: [],
  start_time: "09:00",
  end_time: "17:00",
  duration_minutes: 120,
  lead_days: 0,
  max_days_ahead: 30,
};

const TZ = "+03:00"; // Asia/Amman

export const getAppointmentSettings = cache(async (): Promise<AppointmentSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "appointment").single();
  const raw = (data?.value ?? {}) as Partial<AppointmentSettings>;
  return {
    work_days: Array.isArray(raw.work_days) ? raw.work_days : appointmentDefaults.work_days,
    off_days: Array.isArray(raw.off_days) ? raw.off_days : appointmentDefaults.off_days,
    start_time: raw.start_time || appointmentDefaults.start_time,
    end_time: raw.end_time || appointmentDefaults.end_time,
    duration_minutes: Number(raw.duration_minutes) || appointmentDefaults.duration_minutes,
    lead_days: Number(raw.lead_days) || 0,
    max_days_ahead: Number(raw.max_days_ahead) || appointmentDefaults.max_days_ahead,
  };
});

export function slotToDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00${TZ}`);
}

/** Parse a date + time (tolerates "HH:MM:SS" returned by Postgres `time`). */
export function parseSlotDate(dateStr: string, timeStr: string): Date {
  const t = (timeStr ?? "").slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(t) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr ?? "")) {
    throw new Error("صيغة التاريخ/الوقت غير صالحة");
  }
  const d = slotToDate(dateStr, t);
  if (Number.isNaN(d.getTime())) throw new Error("صيغة التاريخ/الوقت غير صالحة");
  return d;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Read the currently confirmed (blocking) appointments from DB. */
async function fetchBooked(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ start: string; end: string }[]> {
  const { data } = await supabase
    .from("appointments")
    .select("start_at, end_at")
    .in("status", ["approved", "rescheduled", "completed"])
    .not("start_at", "is", null);
  return ((data ?? []) as { start_at: string; end_at: string | null }[]).map((r) => ({
    start: r.start_at,
    end: r.end_at ?? r.start_at,
  }));
}

export function overlaps(start: Date, end: Date, booked: { start: string; end: string }[]): boolean {
  return booked.some((b) => {
    const bs = new Date(b.start).getTime();
    const be = new Date(b.end).getTime();
    return start.getTime() < be && end.getTime() > bs;
  });
}

export interface SlotResult {
  date: string;
  dayOff: boolean;
  outsideHours: boolean;
  slots: string[];
}

export async function getAvailableSlots(dateStr: string): Promise<SlotResult> {
  const settings = await getAppointmentSettings();
  const supabase = await createClient();

  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const dayOff = !settings.work_days.includes(day) || settings.off_days.includes(dateStr);

  const startMin = toMinutes(settings.start_time);
  const endMin = toMinutes(settings.end_time);
  const duration = settings.duration_minutes;

  const slots: string[] = [];
  if (!dayOff) {
    for (let m = startMin; m + duration <= endMin; m += duration) {
      const timeStr = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
      const start = slotToDate(dateStr, timeStr);
      const end = new Date(start.getTime() + duration * 60000);
      if (end.getTime() <= Date.now()) continue;
      slots.push(timeStr);
    }
  }

  // Remove booked slots.
  const booked = await fetchBooked(supabase);
  const available = slots.filter((timeStr) => {
    const start = slotToDate(dateStr, timeStr);
    const end = new Date(start.getTime() + duration * 60000);
    return !overlaps(start, end, booked);
  });

  return {
    date: dateStr,
    dayOff,
    outsideHours: startMin >= endMin,
    slots: available,
  };
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

export function slotEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60000);
}

export function parseTimeToDate(dateStr: string, timeStr: string): Date {
  return slotToDate(dateStr, timeStr);
}

const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmtTime(t: string, locale: "ar" | "en"): string {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = locale === "ar" ? (h >= 12 ? "م" : "ص") : (h >= 12 ? "PM" : "AM");
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Central working-hours string derived from appointment settings (single source). */
export function formatWorkingHours(settings: AppointmentSettings, locale: "ar" | "en"): string {
  const names = locale === "ar" ? DAY_NAMES_AR : DAY_NAMES_EN;
  const days = settings.work_days.map((d) => names[d] ?? "");
  const hours = `${fmtTime(settings.start_time, locale)} – ${fmtTime(settings.end_time, locale)}`;
  if (locale === "ar") return `أيام العمل: ${days.join("، ")} | ${hours}`;
  return `Working days: ${days.join(", ")} | ${hours}`;
}
