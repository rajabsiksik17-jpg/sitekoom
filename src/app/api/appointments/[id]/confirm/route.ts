import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { overlaps } from "@/lib/appointments";
import { getAdminNotificationEmail } from "@/lib/admin-notify";
import { sendSiteEmail } from "@/lib/email/send";
import { getAppointmentServices, formatRange, sendAppointmentCustomerEmail } from "@/lib/appointment-emails";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: appt } = await admin.from("appointments").select("*").eq("id", (await params).id).single();
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (appt.confirm_token !== body.token) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  if (appt.confirm_token_expires_at && new Date(appt.confirm_token_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "انتهت صلاحية رابط الموافقة" }, { status: 410 });
  }
  if (!appt.proposed_start_at || !appt.proposed_end_at) return NextResponse.json({ error: "No proposed time" }, { status: 400 });

  const start = new Date(appt.proposed_start_at);
  const end = new Date(appt.proposed_end_at);

  const { data: booked } = await admin
    .from("appointments")
    .select("start_at, end_at")
    .in("status", ["approved", "rescheduled"])
    .not("start_at", "is", null)
    .neq("id", appt.id);

  if (overlaps(start, end, (booked ?? []).map((r) => ({ start: r.start_at, end: r.end_at ?? r.start_at })))) {
    // Notify the admin that the proposed slot was taken.
    const to = await getAdminNotificationEmail();
    if (to) {
      await sendSiteEmail({
        to,
        subject: "تعارض موعد — لم يتم اعتماد الحجز",
        locale: "ar",
        type: "appointment",
        title: "تعارض في الموعد المقترح",
        body: `<p style="margin:0 0 8px;color:#4b5563;">حاول العميل ${appt.customer_name} الموافقة على الموعد الجديد لكنه لم يعد متاحًا.</p>`,
      }).catch(() => null);
    }
    return NextResponse.json({ error: "The proposed time is no longer available" }, { status: 409 });
  }

  const { error } = await admin
    .from("appointments")
    .update({ status: "rescheduled", start_at: start.toISOString(), end_at: end.toISOString(), proposed_start_at: null, proposed_end_at: null, confirm_token: null, confirm_token_expires_at: null })
    .eq("id", appt.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const locale = (appt.language as "ar" | "en") || "ar";
  const services = await getAppointmentServices(appt.service_ids ?? []);
  await sendAppointmentCustomerEmail(appt as never, services, {
    subject: locale === "en" ? "Your new appointment time is confirmed" : "تم تأكيد موعدك الجديد",
    title: locale === "en" ? "New time confirmed" : "تم تأكيد الموعد الجديد",
    body: `<p style="margin:0;color:#4b5563;">${locale === "en" ? "Your appointment has been rescheduled to:" : "تم تأجيل موعدك إلى:"} <strong>${formatRange(start.toISOString(), end.toISOString())}</strong></p>`,
  });

  return NextResponse.json({ ok: true });
}
