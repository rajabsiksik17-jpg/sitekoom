import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { formRateLimit } from "@/lib/rate-limit";
import { sendSiteEmail } from "@/lib/email/send";
import { getAdminNotificationEmail } from "@/lib/admin-notify";

const valueSchema = z.object({
  field_key: z.string().max(200),
  label: z.string().max(300).optional().or(z.literal("")),
  value: z.any().optional(),
});

const schema = z.object({
  form_id: z.string().uuid().optional().nullable(),
  offer_id: z.string().uuid().optional().nullable(),
  values: z.array(valueSchema).default([]),
  selected_option_values: z.array(z.string().uuid()).default([]),
  selected_addons: z.array(z.string().uuid()).default([]),
  selected_packages: z.array(z.string().uuid()).default([]),
  selected_form_option_ids: z.array(z.string().uuid()).default([]),
  name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  subject: z.string().max(300).optional().or(z.literal("")),
  language: z.string().max(5).optional().default("ar"),
  page_url: z.string().max(500).optional().or(z.literal("")),
  source: z.string().max(50).optional().or(z.literal("")),
  utm_source: z.string().max(100).optional().or(z.literal("")),
  utm_medium: z.string().max(100).optional().or(z.literal("")),
  utm_campaign: z.string().max(100).optional().or(z.literal("")),
  utm_term: z.string().max(100).optional().or(z.literal("")),
  utm_content: z.string().max(100).optional().or(z.literal("")),
});

// Recalculates the price server-side ONLY from the offer configuration so the
// client can never forge a total.
async function calculatePrice(admin: ReturnType<typeof createAdminClient>, body: z.infer<typeof schema>) {
  if (!body.offer_id) return null;

  const { data: offer } = await admin.from("offers").select("*").eq("id", body.offer_id).single();
  if (!offer) throw new Error("العرض غير موجود");

  let total = Number(offer.base_price) || 0;
  const currency = offer.currency || "JOD";
  const selectedOptions: Record<string, unknown>[] = [];
  const selectedAddons: Record<string, unknown>[] = [];

  if (body.selected_option_values.length) {
    const { data: values } = await admin
      .from("offer_option_values")
      .select("*")
      .in("id", body.selected_option_values);
    for (const v of values ?? []) {
      // Default options are already included in the base price.
      if (v.is_default) {
        selectedOptions.push({ id: v.id, label_ar: v.label_ar, label_en: v.label_en, price_delta: 0, included: true });
        continue;
      }
      const delta = Number(v.price_delta) || 0;
      total += delta;
      selectedOptions.push({ id: v.id, label_ar: v.label_ar, label_en: v.label_en, price_delta: delta });
    }
  }

  if (body.selected_addons.length) {
    const { data: addons } = await admin
      .from("offer_addons")
      .select("*")
      .in("id", body.selected_addons);
    for (const a of addons ?? []) {
      // Default addons are already included in the base price.
      if (a.is_default) {
        selectedAddons.push({ id: a.id, title_ar: a.title_ar, title_en: a.title_en, price: 0, included: true });
        continue;
      }
      const price = Number(a.price) || 0;
      total += price;
      selectedAddons.push({ id: a.id, title_ar: a.title_ar, title_en: a.title_en, price });
    }
  }

  // Dynamic form field options that carry a price delta.
  if (body.selected_form_option_ids.length) {
    const { data: fieldOptions } = await admin
      .from("dynamic_form_options")
      .select("*")
      .in("id", body.selected_form_option_ids);
    for (const o of fieldOptions ?? []) {
      const delta = Number(o.price_delta) || 0;
      if (delta !== 0) {
        total += delta;
        selectedAddons.push({ id: o.id, title_ar: o.label_ar, title_en: o.label_en, price: delta });
      }
    }
  }

  const pricingRulesApplied: Record<string, unknown>[] = [];
  const { data: rules } = await admin.from("offer_pricing_rules").select("*").eq("offer_id", body.offer_id).eq("enabled", true);
  for (const r of rules ?? []) {
    const cond = (r.condition ?? {}) as { field_key?: string; operator?: string; value?: unknown };
    const fieldVal = body.values.find((v) => v.field_key === cond.field_key)?.value;
    const op = cond.operator ?? "equals";
    const expected = cond.value;
    let match = false;
    if (op === "equals") match = String(fieldVal ?? "") === String(expected ?? "");
    else if (op === "not_equals") match = String(fieldVal ?? "") !== String(expected ?? "");
    else if (op === "contains") match = String(fieldVal ?? "").includes(String(expected ?? ""));
    else if (op === "greater_than") match = Number(fieldVal) > Number(expected);
    if (match) {
      const delta = Number(r.price_delta) || 0;
      total += delta;
      pricingRulesApplied.push({ id: r.id, title_ar: r.title_ar, title_en: r.title_en, price_delta: delta });
    }
  }

  return {
    offer,
    base_price: Number(offer.base_price) || 0,
    currency,
    calculated_total: total,
    selected_options: selectedOptions,
    selected_addons: selectedAddons,
    pricing_rules_applied: pricingRulesApplied,
  };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const deviceId = request.headers.get("x-device-id");

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!body.form_id && !body.offer_id) {
    return NextResponse.json({ error: "Missing form" }, { status: 400 });
  }

  // Per-form rate limiting (same protection on every dynamic form).
  const formKey = body.form_id ?? body.offer_id ?? "general";
  const rl = formRateLimit(formKey, ip, deviceId);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: rl.blocked
          ? "لقد استخدمت هذا النموذج أكثر من 5 مرات خلال أقل من ساعة. يرجى المحاولة لاحقًا."
          : "Too many requests. Please try again later.",
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }


  const admin = createAdminClient();

  let pricing: Awaited<ReturnType<typeof calculatePrice>> = null;
  try {
    pricing = await calculatePrice(admin, body);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }

  const subjectFromValues = body.values.find((v) => v.field_key === "subject")?.value;
  const subject = body.subject || (typeof subjectFromValues === "string" ? subjectFromValues : "");

  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);

  const { data: submission, error } = await admin
    .from("form_submissions")
    .insert({
      form_id: body.form_id || null,
      offer_id: body.offer_id || null,
      customer_name: body.name || null,
      customer_email: body.email || null,
      customer_phone: body.phone || null,
      subject: subject || null,
      language: body.language,
      page_url: body.page_url || null,
      source: body.source || "form",
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_term: body.utm_term || null,
      utm_content: body.utm_content || null,
      ip_hash: ipHash,
      user_agent: request.headers.get("user-agent") ?? null,
      base_price: pricing?.base_price ?? null,
      currency: pricing?.currency ?? null,
      calculated_total: pricing?.calculated_total ?? null,
      selected_options: pricing?.selected_options ?? [],
      selected_addons: pricing?.selected_addons ?? [],
      pricing_rules_applied: pricing?.pricing_rules_applied ?? [],
    })
    .select()
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  if (body.values.length) {
    await admin.from("form_submission_values").insert(
      body.values.map((v, i) => ({
        submission_id: submission.id,
        field_key: v.field_key,
        field_label: v.label || null,
        value: typeof v.value === "string" ? v.value : JSON.stringify(v.value ?? ""),
        sort: i,
      })),
    );
  }

  const offerTitle = pricing?.offer?.title_ar ?? null;

  await admin.from("notifications").insert({
    user_id: null,
    type: "contact",
    title_ar: offerTitle ? `طلب عرض جديد — ${offerTitle}` : "طلب نموذج جديد",
    title_en: offerTitle ? `New offer request — ${pricing?.offer?.title_en ?? ""}` : "New form submission",
    body_ar: body.name ? `${body.name}${offerTitle ? ` — ${offerTitle}` : ""}` : offerTitle ?? "طلب جديد",
    body_en: body.name ? `${body.name}${offerTitle ? ` — ${pricing?.offer?.title_en ?? ""}` : ""}` : "New submission",
    link: `/admin/forms/submissions`,
  });

  const destination = await getAdminNotificationEmail();
  if (destination && body.offer_id) {
    const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const row = (k: string, v: unknown) =>
      v ? `<tr><td style="padding:8px 0;color:#9ca3af;width:150px;vertical-align:top;font-size:13px;">${esc(k)}</td><td style="padding:8px 0;color:#1f2937;font-weight:500;">${esc(v)}</td></tr>` : "";
    const header = (t: string) => `<tr><td colspan="2" style="padding:14px 0 4px;color:#6d28d9;font-weight:700;font-size:12px;letter-spacing:.5px;text-transform:uppercase;">${esc(t)}</td></tr>`;

    let html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">`;
    html += header(body.language === "en" ? "Customer" : "العميل");
    html += row("Name / الاسم", body.name);
    html += row("Email / البريد", body.email);
    html += row("Phone / الهاتف", body.phone);
    html += row("Subject / الموضوع", subject);
    if (offerTitle) html += row(body.language === "en" ? "Offer" : "العرض", offerTitle);

    if (pricing) {
      html += header(body.language === "en" ? "Pricing" : "التسعير");
      html += row(body.language === "en" ? "Base Price" : "السعر الأساسي", pricing.base_price ? `${pricing.base_price} ${pricing.currency}` : "");
      if (pricing.selected_options.length) {
        html += row(body.language === "en" ? "Options" : "الخيارات", pricing.selected_options.map((o: Record<string, unknown>) => `${body.language === "en" ? o.label_en : o.label_ar} (${o.price_delta} ${pricing.currency})`).join(", "));
      }
      if (pricing.selected_addons.length) {
        html += row(body.language === "en" ? "Add-ons" : "الإضافات", pricing.selected_addons.map((a: Record<string, unknown>) => `${body.language === "en" ? a.title_en : a.title_ar} (${a.price} ${pricing.currency})`).join(", "));
      }
      if (pricing.pricing_rules_applied.length) {
        html += row(body.language === "en" ? "Applied Rules" : "قواعد مطبقة", pricing.pricing_rules_applied.map((r: Record<string, unknown>) => `${body.language === "en" ? r.title_en : r.title_ar} (${r.price_delta} ${pricing.currency})`).join(", "));
      }
      html += row(body.language === "en" ? "Total" : "الإجمالي", pricing.calculated_total ? `${pricing.calculated_total} ${pricing.currency}` : "");
    }

    if (body.values.length) {
      html += header(body.language === "en" ? "Form Answers" : "إجابات النموذج");
      for (const v of body.values) {
        if (v.field_key === "subject") continue;
        html += row(v.label || v.field_key, typeof v.value === "string" ? v.value : JSON.stringify(v.value ?? ""));
      }
    }
    html += `</table>`;

    await sendSiteEmail({
      to: destination,
      subject: `New offer request — ${offerTitle ?? ""}`,
      locale: body.language === "en" ? "en" : "ar",
      type: "offer_request",
      title: body.language === "en" ? "New offer request" : "طلب عرض جديد",
      body: html,
    }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    id: submission.id,
    calculated_total: pricing?.calculated_total ?? null,
    currency: pricing?.currency ?? null,
  });
}
