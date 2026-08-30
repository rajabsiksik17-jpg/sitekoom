import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getAppointmentSettings, overlaps, parseSlotDate } from "@/lib/appointments";
import { sendSiteEmail } from "@/lib/email/send";
import { getAppointmentServices, formatRange } from "@/lib/appointment-emails";

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(5).max(40),
  email: z.string().email().optional().or(z.literal("")),
  service_ids: z.array(z.string().uuid()).default([]),
  subject: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duration_minutes: z.number().int().min(15).max(1440),
  override_hours: z.boolean().optional().default(false),
});

function toMin(t: string): number {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "appointments.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const settings = await getAppointmentSettings();
  let start: Date;
  let end: Date;
  try {
    start = parseSlotDate(body.date, body.time);
  } catch {
    return NextResponse.json({ error: "صيغة التاريخ/الوقت غير صالحة" }, { status: 400 });
  }
  end = new Date(start.getTime() + body.duration_minutes * 60000);

  // Respect working hours unless the admin explicitly overrides them.
  if (!body.override_hours) {
    const day = new Date(`${body.date}T00:00:00Z`).getUTCDay();
    if (!settings.work_days.includes(day) || settings.off_days.includes(body.date)) {
      return NextResponse.json({ error: "اليوم المحدد خارج أيام الدوام" }, { status: 400 });
    }
    const startMin = toMin(body.time.slice(0, 5));
    const endMin = startMin + body.duration_minutes;
    if (startMin < toMin(settings.start_time) || endMin > toMin(settings.end_time)) {
      return NextResponse.json({ error: "الوقت المحدد خارج ساعات الدوام" }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Prevent double booking (overlap with any confirmed appointment).
  const { data: booked } = await admin
    .from("appointments")
    .select("start_at, end_at")
    .in("status", ["approved", "rescheduled"])
    .not("start_at", "is", null);
  if (overlaps(start, end, (booked ?? []).map((r) => ({ start: r.start_at, end: r.end_at ?? r.start_at })))) {
    return NextResponse.json({ error: "الموعد متعارض مع موعد محجوز آخر" }, { status: 409 });
  }

  const { data: appt, error } = await admin
    .from("appointments")
    .insert({
      customer_name: body.name,
      customer_phone: body.phone,
      customer_email: body.email || null,
      service_ids: body.service_ids,
      subject: body.subject || "",
      notes: body.notes || null,
      language: "ar",
      source: "admin",
      requested_date: body.date,
      requested_time: body.time.slice(0, 5),
      duration_minutes: body.duration_minutes,
      status: "approved",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    })
    .select()
    .single();

  if (error || !appt) {
    return NextResponse.json({ error: error?.message ?? "فشل إنشاء الموعد" }, { status: 500 });
  }

  // Optional confirmation email (never fails the creation when email is empty).
  if (body.email) {
    const services = await getAppointmentServices(body.service_ids);
    const rows = [
      ["الاسم", body.name],
      ["الخدمات", services.join("، ")],
      ["الموعد", formatRange(start.toISOString(), end.toISOString())],
      ["المدة", `${body.duration_minutes} دقيقة`],
      ["التفاصيل", body.subject],
    ];
    await sendSiteEmail({
      to: body.email,
      subject: "تأكيد موعدك مع Sitekoom",
      locale: "ar",
      type: "appointment",
      title: "تم تسجيل موعدك",
      body: `<p style="margin:0 0 16px;color:#4b5563;">تم تسجيل موعدك بنجاح.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:8px 0;color:#9ca3af;width:120px;vertical-align:top;font-size:13px;">${String(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${String(v)}</td></tr>`)
        .join("")}</table>`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, id: appt.id });
}
