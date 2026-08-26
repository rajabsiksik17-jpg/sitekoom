"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated with the scoped `chat_token` JWT
 * (issued by /api/chat/start). This client can only read/write the live-chat
 * rows belonging to that token, via the token-scoped RLS policies. Realtime
 * subscriptions use the same token, so visitors only stream their own chat.
 */
export function createChatClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createSupabaseClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  client.auth.setSession({ access_token: accessToken, refresh_token: "" }).catch(() => {});
  return client;
}
