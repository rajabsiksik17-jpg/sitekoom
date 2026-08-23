import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { computeNewExpiry, durationDays, durationLabel } from "@/lib/renewal-service";
import { sendSiteEmail } from "@/lib/email/send";
import { broadcastClientUpdate } from "@/lib/realtime";

const schema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

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

  const { data: requestRow } = await admin
    .from("renewal_requests")
    .select("*")
    .eq("id", body.request_id)
    .single();

  if (!requestRow) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (body.action === "reject") {
    const { data: updated } = await admin
      .from("renewal_requests")
      .update({ status: "rejected" })
      .eq("id", body.request_id)
      .in("status", ["new", "in_review"])
      .select("id")
      .maybeSingle();

    if (!updated) return NextResponse.json({ error: "تمت معالجة هذا الطلب مسبقًا" }, { status: 409 });

    await admin.from("client_notifications").insert({
      client_id: requestRow.client_id,
      type: "renewal",
      title_ar: "تم رفض طلب التجديد",
      title_en: "Renewal request rejected",
      body_ar: `نعتذر، تم رفض طلب تجديد "${requestRow.service_name}".`,
      body_en: `We're sorry, your renewal request for "${requestRow.service_name}" was rejected.`,
      link: "/client-portal/renewals",
    });

    await broadcastClientUpdate(requestRow.client_id, "renewal-updated");

    return NextResponse.json({ ok: true, action: "rejected" });
  }

  // Idempotency guard: only transition from new/in_review → approved once.
  const { data: claimed } = await admin
    .from("renewal_requests")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", body.request_id)
    .in("status", ["new", "in_review"])
    .select("id")
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json({ error: "تمت معالجة هذا الطلب مسبقًا ولا يمكن تكرار الموافقة" }, { status: 409 });
  }

  // Prevent double-processing even if the guard was bypassed somehow.
  const { data: existingHistory } = await admin
    .from("renewal_history")
    .select("id")
    .eq("request_id", body.request_id)
    .maybeSingle();
  if (existingHistory) {
    return NextResponse.json({ error: "تمت معالجة هذا الطلب مسبقًا" }, { status: 409 });
  }

  const months = requestRow.duration_months ?? 12;
  const days = durationDays(months);
  const now = new Date();

  // Load subscription (central record) + linked website.
  const { data: subscription } = await admin
    .from("client_subscriptions")
    .select("*")
    .eq("id", requestRow.subscription_id)
    .maybeSingle();

  const { data: website } = await admin
    .from("client_websites")
    .select("*")
    .eq("id", requestRow.website_id ?? subscription?.website_id ?? null)
    .maybeSingle();

  const { data: client } = await admin
    .from("clients")
    .select("name, company, email, phone, preferred_language")
    .eq("id", requestRow.client_id)
    .single();

  let subNewExpiry: string | null = null;
  let domainNewExpiry: string | null = null;
  let hostingNewExpiry: string | null = null;
  const oldExpiry = subscription?.expiry_date ?? null;

  if (subscription) {
    subNewExpiry = computeNewExpiry(subscription.expiry_date, days, now);
    await admin.from("client_subscriptions").update({ expiry_date: subNewExpiry, status: "active" }).eq("id", subscription.id);

    // Domain (if covered by the same subscription / linked via website).
    if (subscription.covers_domain !== false) {
      const domainQuery = admin.from("client_domains").select("*").eq("client_id", requestRow.client_id);
      if (subscription.website_id) domainQuery.eq("website_id", subscription.website_id);
      const { data: domains } = await domainQuery.limit(1);
      if (domains && domains.length > 0) {
        domainNewExpiry = computeNewExpiry(domains[0].expiry_date, days, now);
        await admin.from("client_domains").update({ expiry_date: domainNewExpiry, status: "active" }).eq("id", domains[0].id);
      }
    }

    // Hosting (if covered).
    if (subscription.covers_hosting !== false) {
      const hostingQuery = admin.from("client_hosting").select("*").eq("client_id", requestRow.client_id);
      if (subscription.website_id) hostingQuery.eq("website_id", subscription.website_id);
      const { data: hosting } = await hostingQuery.limit(1);
      if (hosting && hosting.length > 0) {
        hostingNewExpiry = computeNewExpiry(hosting[0].expiry_date, days, now);
        await admin.from("client_hosting").update({ expiry_date: hostingNewExpiry, status: "active" }).eq("id", hosting[0].id);
      }
    }
  } else {
    // Legacy request without a linked subscription: extend by the service type.
    if (requestRow.service_type === "domain") {
      const { data: d } = await admin.from("client_domains").select("*").eq("client_id", requestRow.client_id).eq("website_id", requestRow.website_id).maybeSingle();
      if (d) {
        domainNewExpiry = computeNewExpiry(d.expiry_date, days, now);
        await admin.from("client_domains").update({ expiry_date: domainNewExpiry }).eq("id", d.id);
      }
    } else if (requestRow.service_type === "hosting") {
      const { data: h } = await admin.from("client_hosting").select("*").eq("client_id", requestRow.client_id).eq("website_id", requestRow.website_id).maybeSingle();
      if (h) {
        hostingNewExpiry = computeNewExpiry(h.expiry_date, days, now);
        await admin.from("client_hosting").update({ expiry_date: hostingNewExpiry }).eq("id", h.id);
      }
    }
  }

  // Renewal transaction history.
  await admin.from("renewal_history").insert({
    client_id: requestRow.client_id,
    website_id: requestRow.website_id ?? subscription?.website_id ?? null,
    subscription_id: subscription?.id ?? null,
    request_id: requestRow.id,
    service_type: requestRow.service_type,
    period_label: durationLabel(months, "ar"),
    duration: durationLabel(months, "en"),
    days_added: days,
    old_expiry: oldExpiry,
    new_expiry: subNewExpiry,
    amount: requestRow.amount,
    status: "approved",
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  });

  // Notify the client.
  const locale = client?.preferred_language === "en" ? "en" : "ar";
  await admin.from("client_notifications").insert({
    client_id: requestRow.client_id,
    type: "renewal",
    title_ar: "تمت الموافقة على طلب التجديد",
    title_en: "Renewal request approved",
    body_ar: `تمت الموافقة على تجديد "${requestRow.service_name}". تاريخ الانتهاء الجديد: ${subNewExpiry ?? "—"} (تمت إضافة ${days} يوم).`,
    body_en: `Your renewal for "${requestRow.service_name}" was approved. New expiry: ${subNewExpiry ?? "—"} (${days} days added).`,
    link: "/client-portal/renewals",
  });

  // Email (bilingual by preferred language).
  if (client?.email) {
    const site = website?.name ?? website?.domain ?? requestRow.service_name;
    const domain = website?.domain ?? "—";
    const isAr = locale === "ar";
    const subject = isAr ? "تمت الموافقة على طلب التجديد" : "Your renewal request was approved";
    const body = isAr
      ? `<p style="margin:0 0 12px;font-size:14px;color:#374151;">مرحبًا ${client.name}،</p><p style="margin:0 0 16px;font-size:14px;color:#374151;">تمت الموافقة على طلب تجديد "<b>${requestRow.service_name}</b>" للموقع <b>${site}</b>.</p><ul style="margin:0 0 16px;padding-${isAr ? "right" : "left"}:20px;font-size:14px;color:#374151;"><li style="margin:6px 0;">المدة: ${durationLabel(months, "ar")} (${days} يوم)</li><li style="margin:6px 0;">تاريخ الانتهاء الجديد: ${subNewExpiry ?? "—"}</li><li style="margin:6px 0;">الدومين: ${domain}</li><li style="margin:6px 0;">الاستضافة: ${hostingNewExpiry ?? "—"}</li></ul><p style="margin:0;font-size:14px;color:#374151;">يمكنك متابعة التفاصيل من <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/client-portal" style="color:#7a1aff;">بوابة العملاء</a>.</p>`
      : `<p style="margin:0 0 12px;font-size:14px;color:#374151;">Hi ${client.name},</p><p style="margin:0 0 16px;font-size:14px;color:#374151;">Your renewal request for "<b>${requestRow.service_name}</b>" (site <b>${site}</b>) was approved.</p><ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#374151;"><li style="margin:6px 0;">Duration: ${durationLabel(months, "en")} (${days} days)</li><li style="margin:6px 0;">New expiry: ${subNewExpiry ?? "—"}</li><li style="margin:6px 0;">Domain: ${domain}</li><li style="margin:6px 0;">Hosting: ${hostingNewExpiry ?? "—"}</li></ul><p style="margin:0;font-size:14px;color:#374151;">You can review the details in the <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/client-portal" style="color:#7a1aff;">Client Portal</a>.</p>`;
    await sendSiteEmail({ to: client.email, subject, locale, type: "renewal_approved", title: isAr ? "تمت الموافقة على طلب التجديد" : "Renewal approved", body }).catch(() => null);
  }

  await broadcastClientUpdate(requestRow.client_id, "renewal-updated");

  return NextResponse.json({
    ok: true,
    action: "approved",
    days_added: days,
    old_expiry: oldExpiry,
    new_expiry: subNewExpiry,
    domain_expiry: domainNewExpiry,
    hosting_expiry: hostingNewExpiry,
  });
}
