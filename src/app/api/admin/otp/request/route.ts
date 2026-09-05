import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEmailSettings } from "@/lib/email/settings";
import { createAdminOtp } from "@/lib/otp";
import { isAdminDeviceTrusted } from "@/lib/trusted-devices";
import { recordAdminLogin } from "@/lib/admin-login";
import { sendSiteEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Record successful login (last_login_at + login history).
  await recordAdminLogin(
    user.id,
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    request.headers.get("user-agent"),
  );

  const settings = await getEmailSettings();
  if (!settings.otp_enabled) {
    return NextResponse.json({ enabled: false });
  }

  // Trusted device/session → no OTP needed within the trust window.
  if (await isAdminDeviceTrusted(user.id)) {
    return NextResponse.json({ enabled: true, trusted: true });
  }

  const to = user.email;
  if (!to) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني مرتبط بالحساب." }, { status: 400 });
  }

  const code = await createAdminOtp(user.id);
  if (!code) {
    return NextResponse.json({ error: "فشل إنشاء رمز التحقق." }, { status: 500 });
  }

  await sendSiteEmail({
    to,
    subject: "Sitekoom — رمز التحقق",
    locale: "ar",
    type: "admin_otp",
    title: "رمز التحقق",
    body: `<p style="margin:0 0 12px;font-size:14px;color:#374151;">مرحبًا،</p><p style="margin:0 0 20px;font-size:14px;color:#374151;">استخدم رمز التحقق التالي لإكمال عملية تسجيل الدخول:</p><div style="margin:20px 0;padding:24px;background:#f1e9ff;border:1px solid #e4d5ff;border-radius:12px;text-align:center;"><span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#7a1aff;direction:ltr;display:inline-block;">${code}</span></div><p style="margin:0;font-size:12px;color:#9ca3af;">هذا الرمز صالح لمدة 5 دقائق ويمكن استخدامه مرة واحدة فقط.</p>`,
  });

  return NextResponse.json({ enabled: true, trusted: false, sent: true });
}
