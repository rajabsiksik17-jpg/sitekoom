import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { formRateLimit } from "@/lib/rate-limit";
import { getAppointmentSettings } from "@/lib/appointments";
import { sendAppointmentAdminNotification, sendAppointmentCustomerEmail, getAppointmentServices } from "@/lib/appointment-emails";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(5).max(40),
  service_ids: z.array(z.string().uuid()).default([]),
  subject: z.string().min(1).max(300),
  notes: z.string().max(2000).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  language: z.string().max(5).default("ar"),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const deviceId = request.headers.get("x-device-id");
  const rl = formRateLimit("appointment", ip, deviceId);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.blocked ? "تم تقييد الإرسال مؤقتًا." : "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const settings = await getAppointmentSettings();
  const admin = createAdminClient();

  // Validate the requested date is not off / outside working days.
  const day = new Date(`${body.date}T00:00:00Z`).getUTCDay();
  if (settings.off_days.includes(body.date) || !settings.work_days.includes(day)) {
    return NextResponse.json({ error: "The selected day is not available" }, { status: 400 });
  }

  const { data: appointment, error } = await admin
    .from("appointments")
    .insert({
      customer_name: body.name,
      customer_email: body.email,
      customer_phone: body.phone,
      service_ids: body.service_ids,
      subject: body.subject,
      notes: body.notes || null,
      language: body.language,
      requested_date: body.date,
      requested_time: body.time,
      duration_minutes: settings.duration_minutes,
      status: "new",
    })
    .select()
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: "Failed to save appointment" }, { status: 500 });
  }

  const services = await getAppointmentServices(body.service_ids);

  await sendAppointmentAdminNotification(appointment, services, body.language === "en" ? "en" : "ar");

  // Customer acknowledgement email.
  const rows = [
    [body.language === "en" ? "Name" : "الاسم", body.name],
    [body.language === "en" ? "Services" : "الخدمات", services.join(", ")],
    [body.language === "en" ? "Subject" : "الموضوع", body.subject],
    [body.language === "en" ? "Requested date" : "التاريخ المطلوب", body.date],
    [body.language === "en" ? "Requested time" : "الوقت المطلوب", body.time],
  ];
  const customerHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:8px 0;color:#9ca3af;width:150px;vertical-align:top;font-size:13px;">${String(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${String(v)}</td></tr>`)
    .join("")}</table>`;

  await sendAppointmentCustomerEmail(appointment, services, {
    subject: body.language === "en" ? "Your appointment request has been received" : "تم استلام طلب حجز موعدك",
    title: body.language === "en" ? "Appointment request received" : "تم استلام طلب الحجز",
    body: `<p style="margin:0 0 16px;color:#4b5563;">${body.language === "en" ? "We received your appointment request. Our team will review it and confirm your appointment shortly." : "تم استلام طلب حجز موعدك. سيقوم فريقنا بمراجعته وتأكيد الموعد قريبًا."}</p>${customerHtml}`,
  });

  return NextResponse.json({ ok: true, id: appointment.id });
}
