import "server-only";

import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function hashToken(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyToken(code: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(code, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/**
 * Generate a 6-digit one-time code for an admin user, store its hash, and
 * return the plaintext code so the caller can email it. Never persisted in
 * plaintext.
 */
export async function createAdminOtp(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  const { error } = await admin.from("admin_otp").insert({
    user_id: userId,
    token_hash: hashToken(code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  if (error) return null;
  return code;
}

export async function verifyAdminOtp(userId: string, code: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_otp")
    .select("*")
    .eq("user_id", userId)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;
  if (data.attempts >= MAX_ATTEMPTS) return false;

  const ok = verifyToken(code, data.token_hash);

  if (ok) {
    await admin.from("admin_otp").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  } else {
    await admin.from("admin_otp").update({ attempts: (data.attempts ?? 0) + 1 }).eq("id", data.id);
  }

  return ok;
}
