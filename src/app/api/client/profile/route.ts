import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/client-auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const schema = z.object({
  name: z.string().min(1).max(160),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  current_password: z.string().max(200).optional().or(z.literal("")),
  new_password: z.string().min(6).max(200).optional().or(z.literal("")),
});

export async function PATCH(request: NextRequest) {
  const clientId = getClientSession();
  if (!clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    name: body.name,
    company: body.company || null,
    email: body.email || null,
  };

  if (body.new_password) {
    if (!body.current_password) {
      return NextResponse.json({ error: "أدخل كلمة المرور الحالية." }, { status: 400 });
    }
    const { data: existing } = await admin.from("clients").select("password_hash").eq("id", clientId).single();
    if (!existing || !verifyPassword(body.current_password, existing.password_hash)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة." }, { status: 400 });
    }
    payload.password_hash = hashPassword(body.new_password);
  }

  const { error } = await admin.from("clients").update(payload).eq("id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
