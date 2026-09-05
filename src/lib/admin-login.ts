import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export function parseUserAgent(ua: string | null | undefined): { browser: string; os: string } {
  const u = ua ?? "";
  const browser = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "Browser";
  const os = /Windows/.test(u) ? "Windows" : /Mac OS/.test(u) ? "macOS" : /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Linux/.test(u) ? "Linux" : "Device";
  return { browser, os };
}

export async function recordAdminLogin(userId: string, ip: string | null, userAgent: string | null) {
  const admin = createAdminClient();
  await admin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
  await admin.from("admin_login_logs").insert({ user_id: userId, ip_address: ip, user_agent: userAgent, success: true });
}
