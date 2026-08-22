import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getClientSession } from "@/lib/client-auth";

const schema = z.object({
  service_type: z.enum(["subscription", "domain", "hosting"]),
  service_name: z.string().min(1).max(200),
  amount: z.number().min(0).max(1_000_000),
  message: z.string().max(2000).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const clientId = getClientSession();
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

  const { data: client } = await admin.from("clients").select("name,company").eq("id", clientId).single();

  const { data: request_row, error } = await admin
    .from("renewal_requests")
    .insert({
      client_id: clientId,
      service_type: body.service_type,
      service_name: body.service_name,
      amount: body.amount,
      message: body.message || null,
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
    body_ar: `${client?.name ?? "عميل"} — ${body.service_name}`,
    body_en: `${client?.name ?? "Client"} — ${body.service_name}`,
    link: "/admin/clients",
  });

  await admin.from("client_notifications").insert({
    client_id: clientId,
    type: "renewal",
    title_ar: "تم استلام طلب التجديد",
    title_en: "Renewal request received",
    body_ar: `تم استلام طلب تجديد "${body.service_name}" وسيتواصل معك فريق سايتكم قريبًا.`,
    body_en: `We received your renewal request for "${body.service_name}". The Sitekoom team will contact you soon.`,
    link: "/client-portal/renewals",
  });

  return NextResponse.json({ ok: true, id: request_row.id });
}
