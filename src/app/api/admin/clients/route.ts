import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const createSchema = z.object({
  name: z.string().min(1).max(160),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  username: z.string().min(1).max(100),
  password: z.string().min(6).max(200).optional().or(z.literal("")),
  website_url: z.string().max(500).optional().or(z.literal("")),
  admin_url: z.string().max(500).optional().or(z.literal("")),
  website_type: z.string().max(50).optional().or(z.literal("")),
  auth_method: z.string().max(50).optional().or(z.literal("")),
});

const updateSchema = createSchema.extend({ id: z.string().uuid() });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      username: body.username,
      password_hash: hashPassword(body.password),
      website_url: body.website_url || null,
      admin_url: body.admin_url || null,
      website_type: body.website_type || "wordpress",
      auth_method: body.auth_method || "sso_token",
      status: "active",
    })
    .select("id, name, company, email, username, website_url, admin_url, website_type, auth_method, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, client: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    name: body.name,
    company: body.company || null,
    email: body.email || null,
    username: body.username,
    website_url: body.website_url || null,
    admin_url: body.admin_url || null,
    website_type: body.website_type || "wordpress",
    auth_method: body.auth_method || "sso_token",
  };
  if (body.password) payload.password_hash = hashPassword(body.password);

  const { error } = await admin.from("clients").update(payload).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
