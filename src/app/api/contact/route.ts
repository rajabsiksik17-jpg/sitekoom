import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { getAdminNotificationEmail } from "@/lib/admin-notify";
import { contactRequestEmail, autoReplyEmail } from "@/lib/email/templates";
import type { ContactRequest } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(160).optional().or(z.literal("")),
  service_id: z.string().uuid().optional().or(z.literal("")),
  service_name: z.string().max(200).optional().or(z.literal("")),
  subject: z.string().max(200).optional().or(z.literal("")),
  message: z.string().min(1).max(5000),
  budget: z.string().max(100).optional().or(z.literal("")),
  source: z.string().max(50).optional(),
  source_page: z.string().max(500).optional(),
  source_ref_id: z.string().uuid().optional().or(z.literal("")),
  referrer: z.string().max(500).optional().or(z.literal("")),
  utm_source: z.string().max(100).optional().or(z.literal("")),
  utm_medium: z.string().max(100).optional().or(z.literal("")),
  utm_campaign: z.string().max(100).optional().or(z.literal("")),
  utm_term: z.string().max(100).optional().or(z.literal("")),
  utm_content: z.string().max(100).optional().or(z.literal("")),
  device_type: z.string().max(20).optional().or(z.literal("")),
  locale: z.string().max(5).optional().default("ar"),
  country: z.string().max(10).optional().or(z.literal("")),
  reason: z.string().max(300).optional().or(z.literal("")),
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
  const rl = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Resolve service title from service_id if not explicitly provided.
  let serviceName = body.service_name || null;
  if (!serviceName && body.service_id) {
    const { data: svc } = await admin.from("services").select("title_ar,title_en").eq("id", body.service_id).single();
    if (svc) serviceName = body.locale === "ar" ? svc.title_ar : svc.title_en;
  }

  const insert = {
    name: body.name,
    email: body.email || null,
    phone: body.phone || null,
    company: body.company || null,
    service_id: body.service_id || null,
    service_name: serviceName,
    subject: body.subject || null,
    message: body.message,
    budget: body.budget || null,
    source: body.source || "contact",
    source_page: body.source_page || null,
    source_ref_id: body.source_ref_id || null,
    referrer: body.referrer || request.headers.get("referer") || null,
    utm_source: body.utm_source || null,
    utm_medium: body.utm_medium || null,
    utm_campaign: body.utm_campaign || null,
    utm_term: body.utm_term || null,
    utm_content: body.utm_content || null,
    device_type: body.device_type || detectDevice(request.headers.get("user-agent")),
    ip_address: ip,
    country: body.country || null,
    reason: body.reason || null,
    phone_meta: body.phone_meta || null,
  };

  const { data: contact, error } = await admin
    .from("contact_requests")
    .insert(insert)
    .select()
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  const saved = contact as ContactRequest;
  const locale = (body.locale === "en" ? "en" : "ar") as "ar" | "en";

  // Admin notification
  await admin.from("notifications").insert({
    user_id: null,
    type: "contact",
    title_ar: "طلب تواصل جديد",
    title_en: "New contact request",
    body_ar: `${saved.name}${saved.service_name ? ` — ${saved.service_name}` : ""}`,
    body_en: `${saved.name}${saved.service_name ? ` — ${saved.service_name}` : ""}`,
    link: `/admin/contacts/${saved.id}`,
  });

  // Analytics event
  await admin.from("analytics_events").insert({
    event_type: "contact_form_submitted",
    entity_type: saved.source,
    page_path: saved.source_page,
    referrer: saved.referrer,
    utm_source: saved.utm_source,
    utm_medium: saved.utm_medium,
    utm_campaign: saved.utm_campaign,
  });

  // Emails (non-blocking for the response; fire and forget best-effort)
  const { data: settingsRow } = await admin.from("site_settings").select("value").eq("key", "contact").single();
  const contactSettings = (settingsRow?.value ?? {}) as {
    destination_email?: string;
    auto_reply?: boolean;
  };
  const destination = await getAdminNotificationEmail();
  const email = contactRequestEmail(saved, locale);

  if (destination) {
    await sendEmail({ to: destination, subject: email.subject, html: email.html, text: email.text, type: "contact_request" }).catch(
      () => null,
    );
  }
  if (saved.email && contactSettings.auto_reply !== false) {
    const reply = autoReplyEmail(saved, locale);
    await sendEmail({ to: saved.email, subject: reply.subject, html: reply.html }).catch(() => null);
  }

  return NextResponse.json({ ok: true, id: saved.id });
}
