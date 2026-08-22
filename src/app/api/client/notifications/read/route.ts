import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/client-auth";

const schema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const clientId = getClientSession();
  if (!clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin.from("client_notifications").update({ is_read: true }).eq("client_id", clientId);
  if (!body.all && body.id) query = query.eq("id", body.id);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
