import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { encryptSecret } from "@/lib/crypto";

const websiteSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(253).optional().or(z.literal("")),
  website_url: z.string().max(500).optional().or(z.literal("")),
  website_type: z.string().max(50).optional().or(z.literal("")),
  admin_url: z.string().max(500).optional().or(z.literal("")),
  status: z.string().max(50).optional().or(z.literal("")),
  login_username: z.string().max(200).optional().or(z.literal("")),
  login_email: z.string().max(200).optional().or(z.literal("")),
  login_password: z.string().max(500).optional().or(z.literal("")),
  credentials_type: z.string().max(50).optional().or(z.literal("")),
});

const subscriptionSchema = z.object({
  plan: z.string().max(200).optional().or(z.literal("")),
  start_date: z.string().max(20).optional().or(z.literal("")),
  duration_months: z.number().int().min(0).max(120).optional(),
  renewal_price: z.number().min(0).max(1_000_000).optional(),
  covers_domain: z.boolean().optional(),
  covers_hosting: z.boolean().optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(160),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  username: z.string().min(1).max(100),
  password: z.string().min(6).max(200).optional().or(z.literal("")),
  preferred_language: z.enum(["ar", "en"]).optional().default("ar"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  website: websiteSchema.optional(),
  subscription: subscriptionSchema.optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(160),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  username: z.string().min(1).max(100),
  password: z.string().min(6).max(200).optional().or(z.literal("")),
  preferred_language: z.enum(["ar", "en"]).optional().default("ar"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  website_url: z.string().max(500).optional().or(z.literal("")),
  admin_url: z.string().max(500).optional().or(z.literal("")),
  website_type: z.string().max(50).optional().or(z.literal("")),
  auth_method: z.string().max(50).optional().or(z.literal("")),
});

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

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

  const { data: client, error } = await admin
    .from("clients")
    .insert({
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      username: body.username,
      password_hash: hashPassword(body.password),
      preferred_language: body.preferred_language ?? "ar",
      status: body.status ?? "active",
    })
    .select("id, name, company, email, phone, username, preferred_language, status, created_at")
    .single();

  if (error || !client) {
    return NextResponse.json({ error: error?.message ?? "فشل إنشاء العميل" }, { status: 400 });
  }

  // Optional: create the client's website (with encrypted site credentials).
  let websiteId: string | null = null;
  if (body.website?.name) {
    const w = body.website;
    const { data: website } = await admin
      .from("client_websites")
      .insert({
        client_id: client.id,
        name: w.name,
        domain: w.domain || null,
        website_url: w.website_url || null,
        admin_url: w.admin_url || null,
        website_type: w.website_type || "wordpress",
        status: w.status || "active",
        login_username: w.login_username || null,
        login_email: w.login_email || null,
        credentials_type: w.credentials_type || (w.login_username || w.login_email ? "wordpress" : "none"),
        credentials_encrypted: w.login_password ? encryptSecret(w.login_password) : null,
      })
      .select("id")
      .single();
    websiteId = website?.id ?? null;
  }

  // Optional: create a central subscription and auto-derive domain/hosting.
  if (body.subscription && body.subscription.duration_months) {
    const s = body.subscription;
    const durationMonths = s.duration_months ?? 0;
    const start = s.start_date || new Date().toISOString().slice(0, 10);
    const expiry = addMonths(start, durationMonths);
    const coversDomain = s.covers_domain !== false;
    const coversHosting = s.covers_hosting !== false;

    await admin.from("client_subscriptions").insert({
      client_id: client.id,
      website_id: websiteId,
      plan: s.plan || null,
      start_date: start,
      expiry_date: expiry,
      renewal_duration: durationMonths === 1 ? "1 month" : durationMonths === 12 ? "1 year" : durationMonths === 24 ? "2 years" : `${durationMonths} months`,
      renewal_price: s.renewal_price ?? 0,
      duration_months: durationMonths,
      covers_domain: coversDomain,
      covers_hosting: coversHosting,
      status: "active",
    });

    if (coversDomain && body.website?.domain) {
      await admin.from("client_domains").insert({
        client_id: client.id,
        website_id: websiteId,
        domain_name: body.website.domain,
        registration_date: start,
        expiry_date: expiry,
        renewal_period: durationMonths === 12 ? "1 year" : `${durationMonths} months`,
        renewal_price: s.renewal_price ?? 0,
        status: "active",
      });
    }

    if (coversHosting) {
      await admin.from("client_hosting").insert({
        client_id: client.id,
        website_id: websiteId,
        plan: s.plan || null,
        start_date: start,
        expiry_date: expiry,
        renewal_period: durationMonths === 12 ? "1 year" : `${durationMonths} months`,
        renewal_price: s.renewal_price ?? 0,
        status: "active",
      });
    }
  }

  return NextResponse.json({ ok: true, client });
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
    phone: body.phone || null,
    username: body.username,
    preferred_language: body.preferred_language ?? "ar",
    status: body.status ?? "active",
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
