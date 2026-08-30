import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getClientSession } from "@/lib/client-auth";
import { durationLabel } from "@/lib/renewal-service";
import { notifyAdminEmail } from "@/lib/admin-notify";

const schema = z.object({
  subscription_id: z.string().uuid().optional(),
  service_type: z.enum(["subscription", "domain", "hosting"]),
  service_name: z.string().min(1).max(200),
  amount: z.number().min(0).max(1_000_000),
  duration_months: z.number().int().min(1).max(24).optional(),
  message: z.string().max(2000).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const clientId = await getClientSession();
  if (!clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`client-renewal:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the subscription (if any) belongs to this client and resolve website.
  let websiteId: string | null = null;
  let subscriptionId: string | null = null;
  if (body.subscription_id) {
    const { data: sub } = await admin
      .from("client_subscriptions")
      .select("id, client_id, website_id")
      .eq("id", body.subscription_id)
      .eq("client_id", clientId)
      .single();
    if (!sub) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    subscriptionId = sub.id;
    websiteId = sub.website_id;
  }

  const { data: client } = await admin.from("clients").select("name,company").eq("id", clientId).single();

  const { data: request_row, error } = await admin
    .from("renewal_requests")
    .insert({
      client_id: clientId,
      website_id: websiteId,
      subscription_id: subscriptionId,
      service_type: body.service_type,
      service_name: body.service_name,
      amount: body.amount,
      message: body.message || null,
      duration_months: body.duration_months ?? null,
      renewal_duration: body.duration_months ? durationLabel(body.duration_months, "ar") : null,
      status: "new",
    })
    .select()
    .single();

  if (error || !request_row) {
    return NextResponse.json({ error: "Failed to create renewal request" }, { status: 500 });
  }

  await admin.from("notifications").insert({
    user_id: null,
    type: "renewal",
    title_ar: "طلب تجديد جديد",
    title_en: "New renewal request",
    body_ar: `${client?.name ?? "عميل"} — ${body.service_name}${body.duration_months ? ` (${durationLabel(body.duration_months, "ar")})` : ""}`,
    body_en: `${client?.name ?? "Client"} — ${body.service_name}${body.duration_months ? ` (${durationLabel(body.duration_months, "en")})` : ""}`,
    link: "/admin/renewals",
  });

  await notifyAdminEmail({
    type: "renewal_request",
    subject: `New renewal request — ${body.service_name}`,
    locale: "ar",
    title: "طلب تجديد جديد",
    body: `<p style="margin:0 0 12px;font-size:14px;color:#374151;"><strong>العميل:</strong> ${client?.name ?? ""}</p><p style="margin:0 0 12px;font-size:14px;color:#374151;"><strong>الخدمة:</strong> ${body.service_name}</p><p style="margin:0 0 12px;font-size:14px;color:#374151;"><strong>المدة:</strong> ${body.duration_months ? durationLabel(body.duration_months, "ar") : "—"}</p><p style="margin:0;font-size:14px;color:#374151;"><strong>القيمة:</strong> ${body.amount}</p>`,
  });

  await admin.from("client_notifications").insert({
    client_id: clientId,
    type: "renewal",
    title_ar: "تم استلام طلب التجديد",
    title_en: "Renewal request received",
    body_ar: `تم استلام طلب تجديد "${body.service_name}" وسيراجعه فريق سايتكم قريبًا.`,
    body_en: `We received your renewal request for "${body.service_name}". The Sitekoom team will review it soon.`,
    link: "/client-portal/renewals",
  });

  return NextResponse.json({ ok: true, id: request_row.id });
}
