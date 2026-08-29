import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getAppointmentSettings, overlaps, parseSlotDate } from "@/lib/appointments";
import { sendAppointmentCustomerEmail, getAppointmentServices, formatRange } from "@/lib/appointment-emails";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "reschedule", "delete"]),
  reject_reason: z.string().max(1000).optional().or(z.literal("")),
  reschedule_reason: z.string().max(1000).optional().or(z.literal("")),
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  new_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "appointments.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof actionSchema>;
  try {
    body = actionSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: appt } = await admin.from("appointments").select("*").eq("id", (await params).id).single();
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const services = await getAppointmentServices(appt.service_ids ?? []);
  const locale = (appt.language as "ar" | "en") || "ar";

  if (body.action === "delete") {
    if (appt.status !== "new") return NextResponse.json({ error: "يمكن حذف الطلبات الجديدة فقط" }, { status: 400 });
    await admin.from("appointments").delete().eq("id", appt.id);
    return NextResponse.json({ ok: true, status: "deleted" });
  }

  if (body.action === "approve") {
    const settings = await getAppointmentSettings();
    let start: Date;
    let end: Date;
    try {
      start = parseSlotDate(String(appt.requested_date ?? ""), String(appt.requested_time ?? ""));
    } catch {
      return NextResponse.json({ error: "صيغة التاريخ/الوقت غير صالحة" }, { status: 400 });
    }
    end = new Date(start.getTime() + (appt.duration_minutes || settings.duration_minutes) * 60000);

    const { data: booked } = await admin
      .from("appointments")
      .select("start_at, end_at")
      .in("status", ["approved", "rescheduled"])
      .not("start_at", "is", null)
      .neq("id", appt.id);

    if (overlaps(start, end, (booked ?? []).map((r) => ({ start: r.start_at, end: r.end_at ?? r.start_at })))) {
      return NextResponse.json({ error: "الموعد غير متاح — تم حجزه مسبقًا" }, { status: 409 });
    }

    const { error } = await admin
      .from("appointments")
      .update({ status: "approved", start_at: start.toISOString(), end_at: end.toISOString() })
      .eq("id", appt.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = [
      [locale === "en" ? "Name" : "الاسم", appt.customer_name],
      [locale === "en" ? "Services" : "الخدمات", services.join(", ")],
      [locale === "en" ? "Date & time" : "التاريخ والوقت", formatRange(start.toISOString(), end.toISOString())],
      [locale === "en" ? "Duration" : "المدة", `${appt.duration_minutes} ${locale === "en" ? "min" : "دقيقة"}`],
    ];
    const bodyHtml = `<p style="margin:0 0 16px;color:#4b5563;">${locale === "en" ? "Your appointment has been confirmed. We look forward to seeing you!" : "تم تأكيد موعدك. نتطلع إلى رؤيتك!"}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
      .map(([k, v]) => `<tr><td style="padding:8px 0;color:#9ca3af;width:150px;vertical-align:top;font-size:13px;">${String(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${String(v)}</td></tr>`)
      .join("")}</table>`;
    await sendAppointmentCustomerEmail(appt as never, services, {
      subject: locale === "en" ? "Your appointment is confirmed" : "تم تأكيد موعدك",
      title: locale === "en" ? "Appointment confirmed" : "تم تأكيد الموعد",
      body: bodyHtml,
    });

    return NextResponse.json({ ok: true, status: "approved" });
  }

  if (body.action === "reject") {
    const { error } = await admin.from("appointments").update({ status: "rejected", reject_reason: body.reject_reason || null }).eq("id", appt.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await sendAppointmentCustomerEmail(appt as never, services, {
      subject: locale === "en" ? "Your appointment request was declined" : "تم رفض طلب حجز موعدك",
      title: locale === "en" ? "Appointment declined" : "تم رفض طلب الموعد",
      body: `<p style="margin:0;color:#4b5563;">${body.reject_reason || (locale === "en" ? "Unfortunately we could not confirm your appointment." : "نأسف، لم نتمكن من تأكيد الموعد.")}</p>`,
    });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (body.action === "reschedule") {
    if (!body.new_date || !body.new_time) return NextResponse.json({ error: "Missing new date/time" }, { status: 400 });
    if (!body.reschedule_reason?.trim()) return NextResponse.json({ error: "سبب تغيير الموعد مطلوب" }, { status: 400 });

    const settings = await getAppointmentSettings();
    let proposedStart: Date;
    let proposedEnd: Date;
    try {
      proposedStart = parseSlotDate(body.new_date, body.new_time);
    } catch {
      return NextResponse.json({ error: "صيغة التاريخ/الوقت غير صالحة" }, { status: 400 });
    }
    proposedEnd = new Date(proposedStart.getTime() + (appt.duration_minutes || settings.duration_minutes) * 60000);

    const token = randomUUID();
    const oldRange = appt.start_at ? formatRange(appt.start_at, appt.end_at) : `${appt.requested_date} ${String(appt.requested_time).slice(0, 5)}`;

    const { error } = await admin
      .from("appointments")
      .update({
        status: "awaiting_client",
        proposed_start_at: proposedStart.toISOString(),
        proposed_end_at: proposedEnd.toISOString(),
        old_start_at: appt.start_at ?? null,
        old_end_at: appt.end_at ?? null,
        reschedule_reason: body.reschedule_reason,
        confirm_token: token,
        confirm_token_expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
      })
      .eq("id", appt.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const confirmUrl = `${SITE_URL}${locale === "ar" ? "" : "/en"}/appointment/confirm?id=${appt.id}&token=${token}`;
    const rows = [
      [locale === "en" ? "Previous time" : "الوقت السابق", oldRange],
      [locale === "en" ? "New proposed time" : "الموعد الجديد المقترح", formatRange(proposedStart.toISOString(), proposedEnd.toISOString())],
      [locale === "en" ? "Duration" : "المدة", `${appt.duration_minutes} ${locale === "en" ? "min" : "دقيقة"}`],
      [locale === "en" ? "Reason" : "سبب التغيير", body.reschedule_reason || ""],
    ];
    const bodyHtml = `<p style="margin:0 0 16px;color:#4b5563;">${locale === "en" ? "A new time has been proposed for your appointment. Please confirm it." : "تم اقتراح موعد جديد لحجزك. يرجى تأكيد الموعد الجديد."}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:8px 0;color:#9ca3af;width:150px;vertical-align:top;font-size:13px;">${String(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${String(v)}</td></tr>`)
      .join("")}</table><div style="margin-top:20px;"><a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#7a1aff,#9d72ff);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;">${locale === "en" ? "Approve New Appointment" : "الموافقة على الموعد الجديد"}</a></div>`;
    await sendAppointmentCustomerEmail(appt as never, services, {
      subject: locale === "en" ? "A new time was proposed for your appointment" : "تم اقتراح موعد جديد لموعدك",
      title: locale === "en" ? "New time proposed" : "تم اقتراح موعد جديد",
      body: bodyHtml,
    });

    return NextResponse.json({ ok: true, status: "awaiting_client" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
