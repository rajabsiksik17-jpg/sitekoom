import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendSiteEmail } from "@/lib/email/send";
import { getAdminNotificationEmail } from "@/lib/admin-notify";
import { mintChatAccessToken } from "@/lib/chat-token";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(1).max(3000),
  source_page: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`chat:${ip}`, 5, 60_000);
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
  const { data: conversation, error } = await admin
    .from("live_chat_conversations")
    .insert({
      visitor_name: body.name,
      visitor_email: body.email || null,
      visitor_phone: body.phone || null,
      first_message: body.message,
      status: "waiting",
      source_page: body.source_page || null,
      referrer: body.referrer || null,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !conversation) {
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }

  await admin.from("live_chat_messages").insert({
    conversation_id: conversation.id,
    sender_type: "visitor",
    body: body.message,
  });

  await admin.from("notifications").insert({
    user_id: null,
    type: "chat",
    title_ar: "محادثة جديدة تنتظر الموافقة",
    title_en: "New chat waiting",
    body_ar: `${body.name} ينتظر اتصال أحد موظفي الدعم.`,
    body_en: `${body.name} is waiting for a support agent.`,
    link: "/admin/chat",
  });

  // Email notification (best-effort, non-blocking)
  const destination = await getAdminNotificationEmail();
  if (destination) {
    const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendSiteEmail({
      to: destination,
      subject: "New live chat request",
      locale: "ar",
      type: "live_chat_request",
      title: "محادثة مباشرة جديدة",
      body: `<p style="margin:0 0 12px;font-size:14px;color:#374151;"><strong>الاسم:</strong> ${esc(body.name)}</p><p style="margin:0 0 12px;font-size:14px;color:#374151;"><strong>البريد:</strong> ${esc(body.email || "—")}</p><p style="margin:0 0 12px;font-size:14px;color:#374151;"><strong>الهاتف:</strong> ${esc(body.phone || "—")}</p><p style="margin:0;font-size:14px;color:#374151;"><strong>الرسالة:</strong> ${esc(body.message)}</p>`,
    }).catch(() => null);
  }

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      visitor_token: conversation.visitor_token,
      status: conversation.status,
      agent_name: null,
      agent_avatar: null,
      agent_position: null,
    },
    access_token: mintChatAccessToken(conversation.visitor_token),
  });
}
