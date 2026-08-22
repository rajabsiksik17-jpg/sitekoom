import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

const schema = z.object({
  id: z.string().uuid().optional(),
  client_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  domain: z.string().max(253).optional().or(z.literal("")),
  website_url: z.string().max(500).optional().or(z.literal("")),
  admin_url: z.string().max(500).optional().or(z.literal("")),
  website_type: z.string().max(50).optional().or(z.literal("")),
  status: z.string().max(50).optional().or(z.literal("")),
  login_username: z.string().max(200).optional().or(z.literal("")),
  login_email: z.string().max(200).optional().or(z.literal("")),
  login_password: z.string().max(500).optional().or(z.literal("")),
  credentials_type: z.string().max(50).optional().or(z.literal("")),
  ga4_property_id: z.string().max(100).optional().or(z.literal("")),
  ga4_measurement_id: z.string().max(100).optional().or(z.literal("")),
});

const PUBLIC_FIELDS = "id, client_id, name, domain, website_url, admin_url, website_type, status, login_username, login_email, credentials_type, ga4_property_id, ga4_measurement_id, created_at, updated_at";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_websites")
    .insert({
      client_id: body.client_id,
      name: body.name,
      domain: body.domain || null,
      website_url: body.website_url || null,
      admin_url: body.admin_url || null,
      website_type: body.website_type || "wordpress",
      status: body.status || "active",
      login_username: body.login_username || null,
      login_email: body.login_email || null,
      credentials_type: body.credentials_type || "none",
      ga4_property_id: body.ga4_property_id || null,
      ga4_measurement_id: body.ga4_measurement_id || null,
      credentials_encrypted: body.login_password ? encryptSecret(body.login_password) : null,
    })
    .select(PUBLIC_FIELDS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, website: data });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    name: body.name,
    domain: body.domain || null,
    website_url: body.website_url || null,
    admin_url: body.admin_url || null,
    website_type: body.website_type || "wordpress",
    status: body.status || "active",
    login_username: body.login_username || null,
    login_email: body.login_email || null,
    credentials_type: body.credentials_type || "none",
    ga4_property_id: body.ga4_property_id || null,
    ga4_measurement_id: body.ga4_measurement_id || null,
  };
  if (body.login_password) {
    payload.credentials_encrypted = encryptSecret(body.login_password);
  }

  const { data, error } = await admin
    .from("client_websites")
    .update(payload)
    .eq("id", body.id)
    .select(PUBLIC_FIELDS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, website: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("client_websites").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
