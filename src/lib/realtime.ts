import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Notify a logged-in client that their data changed so the client portal can
 * refresh without a manual reload. Uses Supabase Realtime Broadcast; the payload
 * contains no sensitive data (the actual fetch is server-side and session-scoped).
 */
export async function broadcastClientUpdate(clientId: string, event: string) {
  try {
    const admin = createAdminClient();
    const channel = admin.channel("sitekoom-client-updates");
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 2000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        }
      });
    });
    await channel.send({ type: "broadcast", event: "update", payload: { clientId, event } });
    await admin.removeChannel(channel);
  } catch {
    // Best-effort: never break the caller if realtime is unavailable.
  }
}
