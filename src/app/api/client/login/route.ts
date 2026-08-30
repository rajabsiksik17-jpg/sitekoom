import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { createClientSession, setClientSessionCookie, setPendingClientCookie } from "@/lib/client-auth";
import { createClientOtp } from "@/lib/otp";
import { isClientDeviceTrusted } from "@/lib/trusted-devices";
import { sendSiteEmail } from "@/lib/email/send";

const schema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent");
  const rl = rateLimit(`client-login:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("*")
    .or(`username.eq.${body.username},email.eq.${body.username}`)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client || !verifyPassword(body.password, client.password_hash)) {
    await admin.from("client_login_logs").insert({ client_id: client?.id ?? null, ip_address: ip, user_agent: ua, success: false });
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة." }, { status: 401 });
  }

  if (client.status !== "active") {
    return NextResponse.json({ error: "هذا الحساب غير مفعّل. يرجى التواصل مع سايتكم." }, { status: 403 });
  }

  const clientSummary = { id: client.id, name: client.name, company: client.company, admin_url: client.admin_url, website_url: client.website_url };

  // Trusted device → login without OTP within the trust window.
  if (await isClientDeviceTrusted(client.id)) {
    await setClientSessionCookie(createClientSession(client.id));
    await admin.from("client_login_logs").insert({ client_id: client.id, ip_address: ip, user_agent: ua, success: true });
    return NextResponse.json({ ok: true, needsOtp: false, client: clientSummary });
  }

  // No email on file → cannot send OTP, allow direct login.
  if (!client.email) {
    await setClientSessionCookie(createClientSession(client.id));
    await admin.from("client_login_logs").insert({ client_id: client.id, ip_address: ip, user_agent: ua, success: true });
    return NextResponse.json({ ok: true, needsOtp: false, client: clientSummary });
  }

  // New/untrusted device → send a one-time code.
  const code = await createClientOtp(client.id);
  if (code) {
    await setPendingClientCookie(client.id);
    const locale = client.preferred_language === "en" ? "en" : "ar";
    const isAr = locale === "ar";
    await sendSiteEmail({
      to: client.email,
      subject: isAr ? "Sitekoom — رمز التحقق من جهاز جديد" : "Sitekoom — New device verification code",
      locale,
      type: "client_otp",
      title: isAr ? "رمز التحقق" : "Verification code",
      body: isAr
        ? `<p style="margin:0 0 12px;font-size:14px;color:#374151;">مرحبًا،</p><p style="margin:0 0 20px;font-size:14px;color:#374151;">استخدم رمز التحقق التالي لتأكيد تسجيل الدخول من جهاز جديد:</p><div style="margin:20px 0;padding:24px;background:#f1e9ff;border:1px solid #e4d5ff;border-radius:12px;text-align:center;"><span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#7a1aff;direction:ltr;display:inline-block;">${code}</span></div><p style="margin:0;font-size:12px;color:#9ca3af;">هذا الرمز صالح لمدة 5 دقائق ويمكن استخدامه مرة واحدة فقط.</p>`
        : `<p style="margin:0 0 12px;font-size:14px;color:#374151;">Hi,</p><p style="margin:0 0 20px;font-size:14px;color:#374151;">Use the following verification code to confirm sign-in from a new device:</p><div style="margin:20px 0;padding:24px;background:#f1e9ff;border:1px solid #e4d5ff;border-radius:12px;text-align:center;"><span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#7a1aff;direction:ltr;display:inline-block;">${code}</span></div><p style="margin:0;font-size:12px;color:#9ca3af;">This code is valid for 5 minutes and can be used only once.</p>`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, needsOtp: true, client: clientSummary });
}
