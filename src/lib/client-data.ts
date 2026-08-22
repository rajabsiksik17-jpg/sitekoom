import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "@/lib/client-auth";
import { localizePath, type Locale } from "@/lib/i18n/config";
import type {
  Client,
  ClientDomain,
  ClientHosting,
  ClientNotification,
  ClientSubscription,
  ClientWebsite,
  EducationalVideo,
  LiveChatConversation,
  LiveChatMessage,
  RenewalRequest,
} from "@/lib/types";

/**
 * Resolve the current authenticated client (or redirect to login). Cached per
 * request so the layout and pages share one lookup.
 */
export const getCurrentClient = cache(async (locale: Locale): Promise<Client> => {
  const clientId = getClientSession();
  if (!clientId) redirect(localizePath("/client-login", locale));

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .is("deleted_at", null)
    .single();

  if (!client || client.status !== "active") {
    redirect(localizePath("/client-login", locale));
  }

  return client as Client;
});

export const getClientWebsites = cache(async (clientId: string): Promise<ClientWebsite[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_websites")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ClientWebsite[];
});

export const getClientSubscriptions = cache(async (clientId: string): Promise<ClientSubscription[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_subscriptions")
    .select("*")
    .eq("client_id", clientId)
    .order("expiry_date", { ascending: true });
  return (data ?? []) as ClientSubscription[];
});

export const getClientDomains = cache(async (clientId: string): Promise<ClientDomain[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_domains")
    .select("*")
    .eq("client_id", clientId)
    .order("expiry_date", { ascending: true });
  return (data ?? []) as ClientDomain[];
});

export const getClientHosting = cache(async (clientId: string): Promise<ClientHosting[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_hosting")
    .select("*")
    .eq("client_id", clientId)
    .order("expiry_date", { ascending: true });
  return (data ?? []) as ClientHosting[];
});

export const getClientRenewalRequests = cache(async (clientId: string): Promise<RenewalRequest[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("renewal_requests")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as RenewalRequest[];
});

export const getClientNotifications = cache(async (clientId: string): Promise<ClientNotification[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_notifications")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as ClientNotification[];
});

export const getUnreadCount = cache(async (clientId: string): Promise<number> => {
  const admin = createAdminClient();
  const { count } = await admin
    .from("client_notifications")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_read", false);
  return count ?? 0;
});

export const getEducationalVideos = cache(async (websiteType: string): Promise<EducationalVideo[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("educational_videos")
    .select("*")
    .eq("is_active", true)
    .order("sort", { ascending: true });
  const videos = (data ?? []) as EducationalVideo[];
  return videos.filter((v) => v.target_type === "all" || v.target_type === websiteType);
});

export const getClientConversations = cache(async (clientId: string): Promise<LiveChatConversation[]> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_chat_conversations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as LiveChatConversation[];
});

export const getClientConversationMessages = cache(
  async (clientId: string): Promise<Map<string, LiveChatMessage[]>> => {
    const admin = createAdminClient();
    const { data: conversations } = await admin
      .from("live_chat_conversations")
      .select("id")
      .eq("client_id", clientId)
      .limit(100);
    const ids = (conversations ?? []).map((c) => c.id);
    if (ids.length === 0) return new Map();

    const { data: messages } = await admin
      .from("live_chat_messages")
      .select("*")
      .in("conversation_id", ids)
      .order("created_at", { ascending: true });

    const map = new Map<string, LiveChatMessage[]>();
    for (const m of (messages ?? []) as LiveChatMessage[]) {
      const list = map.get(m.conversation_id) ?? [];
      list.push(m);
      map.set(m.conversation_id, list);
    }
    return map;
  },
);
