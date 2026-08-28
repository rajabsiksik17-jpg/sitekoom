import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSiteEmail } from "@/lib/email/send";
import { getAdminNotificationEmail } from "@/lib/admin-notify";
import type { Appointment } from "@/lib/types";

const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function formatSlot(date: string, time: string, duration: number): string {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const start = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+03:00`);
  const end = new Date(start.getTime() + duration * 60000);
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${fmt(start)}–${fmt(end)}`;
}

export function formatRange(startAt: string | null, endAt: string | null): string {
  if (!startAt) return "—";
  const s = new Date(startAt);
  const e = endAt ? new Date(endAt) : new Date(new Date(startAt).getTime() + 120 * 60000);
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmtDate(s)} ${fmtTime(s)}–${fmtTime(e)}`;
}

export async function sendAppointmentAdminNotification(appt: Appointment, services: string[], locale: "ar" | "en") {
  const to = await getAdminNotificationEmail();
  if (!to) return;
  const rows = [
    ["الاسم / Name", appt.customer_name],
    ["الهاتف / Phone", appt.customer_phone],
    ["البريد / Email", appt.customer_email],
    ["الخدمات / Services", services.join(", ")],
    ["الموضوع / Subject", appt.subject],
    ["الموعد المطلوب / Requested", `${appt.requested_date} ${appt.requested_time}`],
    ["الملاحظات / Notes", appt.notes],
  ];
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:8px 0;color:#9ca3af;width:150px;vertical-align:top;font-size:13px;">${esc(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${esc(v)}</td></tr>`)
    .join("")}</table>`;
  await sendSiteEmail({
    to,
    subject: locale === "en" ? "New appointment request" : "طلب حجز موعد جديد",
    locale,
    type: "appointment",
    title: locale === "en" ? "New appointment request" : "طلب حجز موعد جديد",
    body: html,
  }).catch(() => null);
}

export async function sendAppointmentCustomerEmail(appt: Appointment, services: string[], opts: { subject: string; title: string; body: string }) {
  await sendSiteEmail({
    to: appt.customer_email,
    subject: opts.subject,
    locale: (appt.language as "ar" | "en") || "ar",
    type: "appointment",
    title: opts.title,
    body: opts.body,
  }).catch(() => null);
}

export async function getAppointmentServices(serviceIds: string[]): Promise<string[]> {
  if (!serviceIds.length) return [];
  const admin = createAdminClient();
  const { data } = await admin.from("services").select("title_ar, title_en").in("id", serviceIds);
  return ((data ?? []) as { title_ar: string; title_en: string }[]).map((s) => s.title_ar || s.title_en);
}
