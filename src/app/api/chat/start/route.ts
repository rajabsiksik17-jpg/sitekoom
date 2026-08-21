import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

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
  const { data: contactRow } = await admin.from("site_settings").select("value").eq("key", "contact").single();
  const contactSettings = (contactRow?.value ?? {}) as { destination_email?: string };
  const { data: generalRow } = await admin.from("site_settings").select("value").eq("key", "general").single();
  const general = (generalRow?.value ?? {}) as { email?: string };
  const destination = contactSettings.destination_email || general.email || process.env.EMAIL_FROM;
  if (destination) {
    await sendEmail({
      to: destination,
      subject: "New live chat request",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:20px;color:#fff"><h2 style="margin:0">${body.name.replace(/</g, "&lt;")}</h2><p style="margin:4px 0 0;opacity:.85">New live chat request</p></div><div style="padding:20px"><p style="margin:6px 0"><strong>Email:</strong> ${(body.email || "—").replace(/</g, "&lt;")}</p><p style="margin:6px 0"><strong>Phone:</strong> ${(body.phone || "—").replace(/</g, "&lt;")}</p><p style="margin:6px 0"><strong>Message:</strong> ${body.message.replace(/</g, "&lt;")}</p></div></div>`,
      text: `New live chat request\nName: ${body.name}\nEmail: ${body.email || "—"}\nPhone: ${body.phone || "—"}\nMessage: ${body.message}`,
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
  });
}
