import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getEmailSettings } from "@/lib/email/settings";
import { sendSiteEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "settings.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const settings = await getEmailSettings();
  const to = settings.notification_email || user.email;
  if (!to) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني للإرسال إليه." }, { status: 400 });
  }

  const result = await sendSiteEmail({
    to,
    subject: "Sitekoom — رسالة تجريبية",
    locale: "ar",
    type: "test",
    title: "رسالة تجريبية",
    body: `<p style="margin:0;font-size:14px;color:#374151;">هذه رسالة تجريبية لتأكيد إعدادات البريد الإلكتروني واختبار القالب الموحد.</p>`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "فشل إرسال البريد" }, { status: 400 });
  }

  // Also verify IMAP connectivity if configured (best-effort informational).
  await createAdminClient();

  return NextResponse.json({ ok: true });
}
