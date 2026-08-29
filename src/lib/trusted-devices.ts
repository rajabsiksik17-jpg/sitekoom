import "server-only";

import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const TRUST_TTL_DAYS = 30;
const ADMIN_TRUST_COOKIE = "sitekoom_admin_trust";
const CLIENT_TRUST_COOKIE = "sitekoom_client_trust";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function deviceName(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Device";
  return `${browser} · ${os}`;
}

async function createTrustedDeviceRecord(userId: string, name: string): Promise<string | null> {
  const token = randomBytes(32).toString("hex");
  const admin = createAdminClient();
  const { error } = await admin.from("trusted_devices").insert({
    user_id: userId,
    token_hash: hashToken(token),
    device_name: name,
    expires_at: new Date(Date.now() + TRUST_TTL_DAYS * 86_400_000).toISOString(),
  });
  if (error) return null;
  return token;
}

async function verifyTrustedDeviceRecord(userId: string, token: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trusted_devices")
    .select("id")
    .eq("user_id", userId)
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return !!data;
}

// --- Admin trusted device ------------------------------------------------

export async function getAdminTrustToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(ADMIN_TRUST_COOKIE)?.value ?? null;
}

export async function isAdminDeviceTrusted(userId: string): Promise<boolean> {
  const token = await getAdminTrustToken();
  if (!token) return false;
  return verifyTrustedDeviceRecord(userId, token);
}

export async function trustAdminDevice(userId: string, userAgent: string | null | undefined): Promise<boolean> {
  const token = await createTrustedDeviceRecord(userId, deviceName(userAgent));
  if (!token) return false;
  const c = await cookies();
  c.set(ADMIN_TRUST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRUST_TTL_DAYS * 86_400,
  });
  return true;
}

// --- Client trusted device -----------------------------------------------

export async function getClientTrustToken(): Promise<string | null> {
  const c = await cookies();
  return c.get(CLIENT_TRUST_COOKIE)?.value ?? null;
}

export async function isClientDeviceTrusted(clientId: string): Promise<boolean> {
  const token = await getClientTrustToken();
  if (!token) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_trusted_devices")
    .select("id")
    .eq("client_id", clientId)
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return !!data;
}

export async function trustClientDevice(clientId: string, userAgent: string | null | undefined): Promise<boolean> {
  const token = randomBytes(32).toString("hex");
  const admin = createAdminClient();
  const { error } = await admin
    .from("client_trusted_devices")
    .insert({
      client_id: clientId,
      token_hash: hashToken(token),
      device_name: deviceName(userAgent),
      expires_at: new Date(Date.now() + TRUST_TTL_DAYS * 86_400_000).toISOString(),
    });
  if (error) return false;
  const c = await cookies();
  c.set(CLIENT_TRUST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRUST_TTL_DAYS * 86_400,
  });
  return true;
}
