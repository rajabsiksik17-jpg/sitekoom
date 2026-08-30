import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/client-auth";

const schema = z.object({
  website_id: z.string().uuid(),
  ga4_property_id: z.string().max(100).optional().or(z.literal("")),
});

// POST: save the GA4 property id for a website owned by the client.
export async function POST(request: NextRequest) {
  const clientId = await getClientSession();
  if (!clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!body.ga4_property_id) return NextResponse.json({ error: "أدخل GA4 Property ID" }, { status: 400 });

  const admin = createAdminClient();
  const { data: website } = await admin
    .from("client_websites")
    .select("id")
    .eq("id", body.website_id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!website) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { error } = await admin
    .from("client_websites")
    .update({ ga4_property_id: body.ga4_property_id.trim() })
    .eq("id", body.website_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// DELETE: disconnect GA (clear the property id).
export async function DELETE(request: NextRequest) {
  const clientId = await getClientSession();
  if (!clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { website_id } = await request.json().catch(() => ({ website_id: null }));
  if (!website_id || typeof website_id !== "string") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const admin = createAdminClient();
  const { data: website } = await admin
    .from("client_websites")
    .select("id")
    .eq("id", website_id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!website) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await admin.from("client_websites").update({ ga4_property_id: null }).eq("id", website_id);
  return NextResponse.json({ ok: true });
}
