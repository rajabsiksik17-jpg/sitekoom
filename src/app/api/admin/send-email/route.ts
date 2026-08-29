import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSiteEmail } from "@/lib/email/send";

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
  entity_type: z.enum(["offer_request", "contact", "quote", "appointment"]),
  entity_id: z.string().min(1),
  locale: z.enum(["ar", "en"]).optional().default("ar"),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const html = body.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const result = await sendSiteEmail({
    to: body.to,
    subject: body.subject,
    locale: body.locale,
    type: "admin_reply",
    title: body.locale === "en" ? "Message from Sitekoom" : "رسالة من فريق Sitekoom",
    body: `<p style="margin:0;color:#1f2937;line-height:1.7;font-size:15px;">${html}</p>`,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "فشل إرسال البريد" }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    actor_name: user.name || user.email,
    action: "send_email",
    entity_type: body.entity_type,
    entity_id: body.entity_id,
    description: `أرسل بريدًا إلى ${body.to}`,
  });

  // Only offer requests change status (new → replied) on a successful email.
  if (body.entity_type === "offer_request") {
    await admin
      .from("form_submissions")
      .update({ status: "replied", replied_at: new Date().toISOString(), replied_by: user.id })
      .eq("id", body.entity_id)
      .eq("status", "new");
  }

  return NextResponse.json({ ok: true });
}
