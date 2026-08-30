import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getClientSession, createSsoToken } from "@/lib/client-auth";

// Generates a one-time, short-lived, signed SSO token and redirects the client
// to their site's admin URL. The target site (e.g. a Sitekoom WordPress plugin)
// validates the token server-to-server and creates the session — credentials are
// never placed in the URL.
export async function GET(request: NextRequest) {
  const clientId = await getClientSession();
  if (!clientId) {
    return NextResponse.redirect(new URL("/client-login", request.url));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`client-sso:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (!client) {
    return NextResponse.redirect(new URL("/client-portal", request.url));
  }

  // A client may own multiple sites. If a website id is passed, use that
  // site's admin URL; otherwise fall back to the client's primary admin URL.
  let adminUrl = client.admin_url as string | null;
  const websiteId = request.nextUrl.searchParams.get("website");
  if (websiteId) {
    const { data: website } = await admin
      .from("client_websites")
      .select("admin_url")
      .eq("id", websiteId)
      .eq("client_id", client.id)
      .single();
    if (website?.admin_url) adminUrl = website.admin_url;
  }

  if (!adminUrl) {
    return NextResponse.redirect(new URL("/client-portal", request.url));
  }

  const { token, expiresAt } = createSsoToken(client.id, adminUrl);
  await admin.from("client_sso_tokens").insert({
    token,
    client_id: client.id,
    admin_url: adminUrl,
    expires_at: new Date(expiresAt).toISOString(),
  });

  const url = new URL(adminUrl);
  url.searchParams.set("sitekoom_sso", token);
  return NextResponse.redirect(url.toString());
}
