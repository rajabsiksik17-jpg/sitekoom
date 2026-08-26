"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated with the scoped `chat_token` JWT
 * (issued by /api/chat/start). This client can only read/write the live-chat
 * rows belonging to that token, via the token-scoped RLS policies.
 *
 * IMPORTANT: the token is attached directly, NOT via `auth.setSession`.
 * `setSession` fails for a custom anon JWT (it has no `sub`, so GoTrue rejects
 * it on `getUser()`), which would silently leave both REST and Realtime using
 * the anon key — breaking token-scoped RLS.
 *
 * Instead:
 *   - `Authorization` header → PostgREST (REST reads/writes use the JWT).
 *   - `realtime.setAuth(token)` → Realtime WebSocket channel joins use the JWT.
 */
export function createChatClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  client.realtime.setAuth(accessToken);
  return client;
}
