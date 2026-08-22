"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Lightweight realtime refresher for the client portal. Subscribes to a
 * broadcast channel and triggers a router.refresh() when the server signals
 * that this client's data changed (e.g. a renewal was approved). No sensitive
 * data flows over the channel — the actual fetch is session-scoped server-side.
 */
export function ClientRealtimeRefresher({ clientId }: { clientId: string }) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("sitekoom-client-updates")
      .on("broadcast", { event: "update" }, ({ payload }) => {
        if (payload?.clientId === clientId) router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, router]);

  return null;
}
