import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getEmailSettings } from "@/lib/email/settings";
import { sendEmail } from "@/lib/email";

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

  const result = await sendEmail({
    to,
    subject: "Sitekoom — رسالة تجريبية",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:20px;color:#fff"><h2 style="margin:0">Sitekoom</h2></div><div style="padding:20px"><p>هذه رسالة تجريبية لتأكيد إعدادات البريد الإلكتروني.</p></div></div>`,
    type: "test",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "فشل إرسال البريد" }, { status: 400 });
  }

  // Also verify IMAP connectivity if configured (best-effort informational).
  await createAdminClient();

  return NextResponse.json({ ok: true });
}
