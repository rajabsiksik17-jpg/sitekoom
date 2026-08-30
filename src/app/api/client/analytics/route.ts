import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/client-auth";
import { fetchGa4Summary } from "@/lib/ga4";

export const dynamic = "force-dynamic";

function rangeToDates(range: string, customStart?: string, customEnd?: string): { start: string; end: string } {
  const end = customEnd && /^\d{4}-\d{2}-\d{2}$/.test(customEnd) ? customEnd : new Date().toISOString().slice(0, 10);
  let start: string;
  if (range === "custom" && customStart && /^\d{4}-\d{2}-\d{2}$/.test(customStart)) {
    start = customStart;
  } else {
    const days = range === "today" ? 1 : Number(range) || 30;
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    start = d.toISOString().slice(0, 10);
  }
  return { start, end };
}

export async function GET(request: NextRequest) {
  const clientId = await getClientSession();
  if (!clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const websiteId = request.nextUrl.searchParams.get("website_id");
  const range = request.nextUrl.searchParams.get("range") ?? "30";
  const customStart = request.nextUrl.searchParams.get("start") ?? undefined;
  const customEnd = request.nextUrl.searchParams.get("end") ?? undefined;

  if (!websiteId) {
    return NextResponse.json({ error: "Missing website_id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: website } = await admin
    .from("client_websites")
    .select("id, ga4_property_id")
    .eq("id", websiteId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!website) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!website.ga4_property_id) {
    return NextResponse.json({ connected: false });
  }

  const { start, end } = rangeToDates(range, customStart, customEnd);
  const data = await fetchGa4Summary(website.ga4_property_id, start, end);

  if (!data) {
    return NextResponse.json({ connected: true, error: "failed" });
  }

  return NextResponse.json({ connected: true, data });
}
