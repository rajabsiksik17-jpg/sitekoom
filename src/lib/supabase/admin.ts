import "server-only";

import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 * NEVER import this file into a client component.
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials (SUPABASE_SERVICE_ROLE_KEY).");
  }

  adminClient = createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}
