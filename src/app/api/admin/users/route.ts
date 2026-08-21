import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  role_id: z.string().uuid().optional().or(z.literal("")),
});

const resetSchema = z.object({ id: z.string().uuid(), password: z.string().min(8).optional() });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "users.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Failed to create user" }, { status: 400 });
  }

  await admin.from("users").update({ name: body.name, role_id: body.role_id || null }).eq("id", data.user.id);

  await admin.from("audit_logs").insert({
    actor_id: user.id, actor_name: user.name || user.email,
    action: "create", entity_type: "user", entity_id: data.user.id,
    description: `أنشأ المستخدم ${body.email}`,
  });

  return NextResponse.json({ ok: true, id: data.user.id });
}
