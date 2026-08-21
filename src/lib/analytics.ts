"use client";

import { createClient } from "@/lib/supabase/client";

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  const stored = globalThis.localStorage?.getItem("sitekoom_session");
  if (stored) {
    sessionId = stored;
    return stored;
  }
  const id = crypto.randomUUID();
  sessionId = id;
  try {
    globalThis.localStorage?.setItem("sitekoom_session", id);
  } catch {
    /* ignore */
  }
  return id;
}

export type AnalyticsEventType =
  | "page_view"
  | "service_view"
  | "project_view"
  | "article_view"
  | "contact_form_started"
  | "contact_form_submitted"
  | "whatsapp_clicked"
  | "phone_clicked"
  | "live_chat_started"
  | "live_chat_accepted"
  | "project_link_clicked";

export interface TrackPayload {
  event_type: AnalyticsEventType;
  entity_type?: string;
  entity_id?: string;
  page_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

function getUtm(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
    };
  } catch {
    return {};
  }
}

function getDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export async function trackEvent(payload: TrackPayload) {
  try {
    const supabase = createClient();
    await supabase.from("analytics_events").insert({
      ...payload,
      device_type: getDeviceType(),
      session_id: getSessionId(),
    });
  } catch {
    /* analytics must never break the UI */
  }
}
