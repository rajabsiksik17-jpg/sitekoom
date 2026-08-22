import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEmailSettings } from "@/lib/email/settings";
import { createAdminOtp } from "@/lib/otp";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getEmailSettings();
  if (!settings.otp_enabled) {
    return NextResponse.json({ enabled: false });
  }

  const to = user.email;
  if (!to) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني مرتبط بالحساب." }, { status: 400 });
  }

  const code = await createAdminOtp(user.id);
  if (!code) {
    return NextResponse.json({ error: "فشل إنشاء رمز التحقق." }, { status: 500 });
  }

  await sendEmail({
    to,
    subject: "Sitekoom — رمز التحقق",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:20px;color:#fff"><h2 style="margin:0">رمز التحقق</h2></div><div style="padding:20px;text-align:center"><p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:16px 0">${code}</p><p style="color:#888;font-size:13px">هذا الرمز صالح لمدة 5 دقائق ويمكن استخدامه مرة واحدة فقط.</p></div></div>`,
    type: "admin_otp",
  });

  return NextResponse.json({ enabled: true, sent: true });
}
