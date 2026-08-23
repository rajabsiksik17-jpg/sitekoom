import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/client-auth";
import { fetchGa4Summary } from "@/lib/ga4";

export const dynamic = "force-dynamic";

// Test the GA4 connection for a website owned by the client.
export async function POST(request: NextRequest) {
  const clientId = getClientSession();
  if (!clientId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { website_id } = await request.json().catch(() => ({ website_id: null }));
  if (!website_id || typeof website_id !== "string") return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const admin = createAdminClient();
  const { data: website } = await admin
    .from("client_websites")
    .select("ga4_property_id")
    .eq("id", website_id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!website) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!website.ga4_property_id) return NextResponse.json({ connected: false });

  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const data = await fetchGa4Summary(website.ga4_property_id, start, end);

  if (!data) {
    return NextResponse.json({ connected: false, error: "تعذر الاتصال بـ Google Analytics. تحقق من Property ID وصلاحيات الخدمة." });
  }

  return NextResponse.json({ connected: true, sessions: data.sessions });
}
