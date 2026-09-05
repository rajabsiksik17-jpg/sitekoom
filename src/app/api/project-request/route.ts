import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendSiteEmail } from "@/lib/email/send";
import { getAdminNotificationEmail } from "@/lib/admin-notify";
import { notifyAdminsByPermission } from "@/lib/notify-admins";
import type { ProjectRequest } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  country: z.string().max(10).optional().or(z.literal("")),
  company: z.string().max(160).optional().or(z.literal("")),
  service_id: z.string().uuid().optional().nullable(),
  service_name: z.string().max(200).optional().or(z.literal("")),
  other_service: z.string().max(200).optional().or(z.literal("")),
  project_details: z.string().min(1).max(8000),
  budget: z.string().max(100).optional().or(z.literal("")),
  other_budget: z.string().max(100).optional().or(z.literal("")),
  timeline: z.string().max(100).optional().or(z.literal("")),
  attachments: z.array(z.string().url()).optional().default([]),
  source: z.string().max(50).optional(),
  source_page: z.string().max(500).optional(),
  source_ref_id: z.string().uuid().optional().or(z.literal("")),
  source_type: z.string().max(50).optional().or(z.literal("")),
  source_work_id: z.string().uuid().optional().or(z.literal("")),
  source_work_title: z.string().max(300).optional().or(z.literal("")),
  referrer: z.string().max(500).optional().or(z.literal("")),
  utm_source: z.string().max(100).optional().or(z.literal("")),
  utm_medium: z.string().max(100).optional().or(z.literal("")),
  utm_campaign: z.string().max(100).optional().or(z.literal("")),
  utm_term: z.string().max(100).optional().or(z.literal("")),
  utm_content: z.string().max(100).optional().or(z.literal("")),
  device_type: z.string().max(20).optional().or(z.literal("")),
  locale: z.string().max(5).optional().default("ar"),
  phone_meta: z.record(z.string(), z.unknown()).optional().nullable(),
});

function detectDevice(userAgent: string | null): string {
  const ua = userAgent ?? "";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`quote:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  const insert = {
    name: body.name,
    email: body.email || null,
    phone: body.phone || null,
    country: body.country || null,
    company: body.company || null,
    service_id: body.service_id || null,
    service_name: body.service_name || null,
    other_service: body.other_service || null,
    project_details: body.project_details,
    budget: body.budget || null,
    other_budget: body.other_budget || null,
    timeline: body.timeline || null,
    attachments: body.attachments ?? [],
    source: body.source || "quote",
    source_page: body.source_page || null,
    source_ref_id: body.source_ref_id || null,
    source_type: body.source_type || null,
    source_work_id: body.source_work_id || null,
    source_work_title: body.source_work_title || null,
    referrer: body.referrer || request.headers.get("referer") || null,
    utm_source: body.utm_source || null,
    utm_medium: body.utm_medium || null,
    utm_campaign: body.utm_campaign || null,
    utm_term: body.utm_term || null,
    utm_content: body.utm_content || null,
    device_type: body.device_type || detectDevice(request.headers.get("user-agent")),
    ip_address: ip,
    phone_meta: body.phone_meta || null,
  };

  const { data: quote, error } = await admin
    .from("project_requests")
    .insert(insert)
    .select()
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  const saved = quote as ProjectRequest;
  const locale = (body.locale === "en" ? "en" : "ar") as "ar" | "en";

  await admin.from("notifications").insert({
    user_id: null,
    type: "contact",
    title_ar: "طلب تسعير جديد",
    title_en: "New pricing request",
    body_ar: `${saved.name}${saved.service_name ? ` — ${saved.service_name}` : ""}`,
    body_en: `${saved.name}${saved.service_name ? ` — ${saved.service_name}` : ""}`,
    link: `/admin/quotes/${saved.id}`,
  });

  await admin.from("analytics_events").insert({
    event_type: "contact_form_submitted",
    entity_type: "quote",
    page_path: saved.source_page,
    referrer: saved.referrer,
    utm_source: saved.utm_source,
    utm_medium: saved.utm_medium,
    utm_campaign: saved.utm_campaign,
  });

  // Email to admin (dynamic notification inbox)
  const { data: settingsRow } = await admin.from("site_settings").select("value").eq("key", "contact").single();
  const contactSettings = (settingsRow?.value ?? {}) as { quote_email?: string };
  const destination = contactSettings.quote_email || (await getAdminNotificationEmail());

  if (destination) {
    const rows = [
      ["Name", saved.name],
      ["Email", saved.email],
      ["Phone", saved.phone],
      ["Company", saved.company],
      ["Service", saved.service_name ?? saved.other_service],
      ["Budget", saved.budget],
      ["Timeline", saved.timeline],
      ["Details", saved.project_details],
    ];
    const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:8px 0;color:#9ca3af;width:120px;vertical-align:top;font-size:13px;">${esc(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${esc(v)}</td></tr>`)
      .join("")}</table>`;
    await sendSiteEmail({
      to: destination,
      subject: `New project request — ${saved.service_name ?? saved.other_service ?? ""}`,
      locale: locale === "en" ? "en" : "ar",
      type: "pricing_request",
      title: locale === "en" ? "New project request" : "طلب تسعير جديد",
      body,
    }).catch(() => null);

    await notifyAdminsByPermission("contacts.view", {
      subject: `New project request — ${saved.service_name ?? saved.other_service ?? ""}`,
      locale: locale === "en" ? "en" : "ar",
      type: "pricing_request",
      title: locale === "en" ? "New project request" : "طلب تسعير جديد",
      body,
    });
  }

  return NextResponse.json({ ok: true, id: saved.id });
}
