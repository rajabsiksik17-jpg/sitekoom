import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";

const schema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  role_id: z.string().uuid().nullable().optional(),
  notify_email: z.boolean().optional(),
  action: z.enum(["reset", "disable", "enable", "update"]),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "users.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.action === "reset") {
    if (!body.password) return NextResponse.json({ error: "Password required" }, { status: 400 });
    const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (body.action === "update") {
    if (body.email) {
      const { data: dup } = await admin.from("users").select("id").eq("email", body.email).neq("id", body.id).maybeSingle();
      if (dup) return NextResponse.json({ error: "البريد الإلكتروني مستخدم من مستخدم آخر." }, { status: 400 });
    }
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.role_id !== undefined) updates.role_id = body.role_id;
    if (body.notify_email !== undefined) updates.notify_email = body.notify_email;
    if (Object.keys(updates).length) {
      const { error } = await admin.from("users").update(updates).eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (body.email) {
      await admin.auth.admin.updateUserById(body.id, { email: body.email });
    }
  } else {
    const status = body.action === "disable" ? "disabled" : "active";
    const { error } = await admin.from("users").update({ status }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (body.action === "disable") {
      await admin.auth.admin.updateUserById(body.id, { ban_duration: "876000h" });
    } else {
      await admin.auth.admin.updateUserById(body.id, { ban_duration: "none" });
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: user.id, actor_name: user.name || user.email,
    action: body.action, entity_type: "user", entity_id: body.id,
    description: `${body.action} للمستخدم`,
  });

  return NextResponse.json({ ok: true });
}
