import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  visitor_token: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("live_chat_conversations")
    .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: "customer" })
    .eq("visitor_token", body.visitor_token);

  if (error) return NextResponse.json({ error: "Failed to close conversation" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
