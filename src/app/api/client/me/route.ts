import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = await getClientSession();
  if (!clientId) {
    return NextResponse.json({ authenticated: false });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, name: data.name });
}
