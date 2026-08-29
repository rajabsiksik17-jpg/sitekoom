import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getPendingClientId, clearPendingClientCookie, createClientSession, setClientSessionCookie } from "@/lib/client-auth";
import { verifyClientOtp } from "@/lib/otp";
import { trustClientDevice } from "@/lib/trusted-devices";

const schema = z.object({ code: z.string().min(6).max(6), trust: z.boolean().optional() });

export async function POST(request: NextRequest) {
  const clientId = await getPendingClientId();
  if (!clientId) {
    return NextResponse.json({ error: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجددًا." }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`client-otp:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ok = await verifyClientOtp(clientId, body.code);
  if (!ok) {
    return NextResponse.json({ error: "رمز التحقق غير صحيح أو منتهي." }, { status: 400 });
  }

  if (body.trust) {
    await trustClientDevice(clientId, request.headers.get("user-agent"));
  }

  await clearPendingClientCookie();
  await setClientSessionCookie(createClientSession(clientId));

  const admin = createAdminClient();
  await admin.from("client_login_logs").insert({ client_id: clientId, ip_address: ip, user_agent: request.headers.get("user-agent"), success: true });

  return NextResponse.json({ ok: true });
}
