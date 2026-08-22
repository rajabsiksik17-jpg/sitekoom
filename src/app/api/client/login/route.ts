import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { createClientSession, setClientSessionCookie } from "@/lib/client-auth";

const schema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
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
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة." }, { status: 401 });
  }

  if (client.status !== "active") {
    return NextResponse.json({ error: "هذا الحساب غير مفعّل. يرجى التواصل مع سايتكم." }, { status: 403 });
  }

  setClientSessionCookie(createClientSession(client.id));

  return NextResponse.json({
    ok: true,
    client: { id: client.id, name: client.name, company: client.company, admin_url: client.admin_url, website_url: client.website_url },
  });
}
