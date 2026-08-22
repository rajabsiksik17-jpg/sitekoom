import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { createClientSession, setClientSessionCookie, setPendingClientCookie } from "@/lib/client-auth";
import { createClientOtp } from "@/lib/otp";
import { isClientDeviceTrusted } from "@/lib/trusted-devices";
import { sendEmail } from "@/lib/email";

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
    setClientSessionCookie(createClientSession(client.id));
    await admin.from("client_login_logs").insert({ client_id: client.id, ip_address: ip, user_agent: ua, success: true });
    return NextResponse.json({ ok: true, needsOtp: false, client: clientSummary });
  }

  // No email on file → cannot send OTP, allow direct login.
  if (!client.email) {
    setClientSessionCookie(createClientSession(client.id));
    await admin.from("client_login_logs").insert({ client_id: client.id, ip_address: ip, user_agent: ua, success: true });
    return NextResponse.json({ ok: true, needsOtp: false, client: clientSummary });
  }

  // New/untrusted device → send a one-time code.
  const code = await createClientOtp(client.id);
  if (code) {
    setPendingClientCookie(client.id);
    await sendEmail({
      to: client.email,
      subject: "Sitekoom — رمز التحقق من جهاز جديد",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:20px;color:#fff"><h2 style="margin:0">رمز التحقق</h2></div><div style="padding:20px;text-align:center"><p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:16px 0">${code}</p><p style="color:#888;font-size:13px">تم اكتشاف جهاز جديد. أدخل هذا الرمز لتأكيد تسجيل الدخول (صالح لمدة 5 دقائق).</p></div></div>`,
      type: "client_otp",
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, needsOtp: true, client: clientSummary });
}
