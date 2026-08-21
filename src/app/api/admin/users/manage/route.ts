import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";

const schema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8).optional(),
  action: z.enum(["reset", "disable", "enable"]),
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
  } else {
    const status = body.action === "disable" ? "disabled" : "active";
    const { error } = await admin.from("users").update({ status }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (body.action === "disable") {
      await admin.auth.admin.updateUserById(body.id, { ban_duration: "876000h" });
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: user.id, actor_name: user.name || user.email,
    action: body.action, entity_type: "user", entity_id: body.id,
    description: `${body.action} للمستخدم`,
  });

  return NextResponse.json({ ok: true });
}
