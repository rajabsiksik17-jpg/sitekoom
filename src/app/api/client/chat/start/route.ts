import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getClientSession } from "@/lib/client-auth";
import { notifyAdminEmail } from "@/lib/admin-notify";

const schema = z.object({
  message: z.string().min(1).max(3000),
  source_page: z.string().max(500).optional(),
  reason: z.string().max(100).optional(),
});

const REASON_TO_TYPE: Record<string, string> = {
  website_modification: "modification",
  website_issue: "general",
  maintenance: "maintenance",
  development: "development",
  renewal: "renewal",
  inquiry: "general",
  hosting: "hosting",
  domain: "domain",
  woocommerce: "woocommerce",
  wordpress: "wordpress",
  other: "other",
};

// Starts a support conversation as a registered client. Identity is taken from
// the client record (never from the client) so it cannot be spoofed, and the
// conversation is flagged as registered for higher priority in the admin view.
export async function POST(request: NextRequest) {
  const clientId = getClientSession();
  if (!clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`client-chat:${ip}`, 10, 60_000);
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
  const { data: client } = await admin
    .from("clients")
    .select("name,email,phone,company")
    .eq("id", clientId)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conversation, error } = await admin
    .from("live_chat_conversations")
    .insert({
      client_id: clientId,
      is_registered: true,
      visitor_name: client.name,
      visitor_email: client.email || null,
      visitor_phone: client.phone || null,
      first_message: body.message,
      status: "waiting",
      source_page: body.source_page || null,
      last_message_at: new Date().toISOString(),
      conversation_type: body.reason ? REASON_TO_TYPE[body.reason] ?? "general" : "general",
      support_reason: body.reason || null,
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
    title_ar: "محادثة جديدة من عميل مسجل",
    title_en: "New chat from registered client",
    body_ar: `${client.name} ينتظر اتصال أحد موظفي الدعم.`,
    body_en: `${client.name} is waiting for a support agent.`,
    link: "/admin/chat",
  });

  await notifyAdminEmail({
    type: "live_chat_request",
    subject: `New chat from registered client — ${client.name}`,
    text: `Registered client ${client.name} (${client.email ?? ""}) started a chat.\nMessage: ${body.message}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:20px;color:#fff"><h2 style="margin:0">${client.name}</h2><p style="margin:4px 0 0;opacity:.85">Registered client chat</p></div><div style="padding:20px"><p><strong>Email:</strong> ${client.email ?? "—"}</p><p><strong>Message:</strong> ${body.message.replace(/</g, "&lt;")}</p></div></div>`,
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      visitor_token: conversation.visitor_token,
      status: conversation.status,
      agent_name: null,
      agent_avatar: null,
      agent_position: null,
    },
  });
}
