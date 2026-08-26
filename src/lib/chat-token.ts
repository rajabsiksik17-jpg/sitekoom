import "server-only";

import { createHmac } from "node:crypto";

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * Mints a short Supabase-compatible HS256 JWT for the `anon` role carrying a
 * `chat_token` claim (the conversation's unguessable visitor_token). The live
 * chat widgets use this token to read/write only their own conversation via
 * the token-scoped RLS policies.
 *
 * Returns `null` when `SUPABASE_JWT_SECRET` is not configured, so callers can
 * fail gracefully instead of signing with an empty secret.
 */
export function mintChatAccessToken(visitorToken: string): string | null {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  let ref = "";
  try {
    ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0];
  } catch {
    /* keep ref empty */
  }
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      role: "anon",
      chat_token: visitorToken,
      iss: "supabase",
      ref,
      iat: now,
      exp: now + 60 * 60 * 24 * 30, // 30 days
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}
