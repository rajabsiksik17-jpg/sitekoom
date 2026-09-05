import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface GeneralSettings {
  company_name_ar: string;
  company_name_en: string;
  tagline_ar: string;
  tagline_en: string;
  email: string;
  phone: string;
  whatsapp: string;
  whatsapp_message: string;
  address_ar: string;
  address_en: string;
  google_maps_url: string;
  google_maps_embed_url: string;
  working_hours_ar: string;
  working_hours_en: string;
  logo: string;
  logo_width_desktop: number;
  logo_width_tablet: number;
  logo_width_mobile: number;
  favicon: string;
  footer_logo: string;
  footer_logo_width_desktop: number;
  footer_logo_width_tablet: number;
  footer_logo_width_mobile: number;
  about_logo_width_desktop: number;
  about_logo_width_laptop: number;
  about_logo_width_tablet: number;
  about_logo_width_mobile: number;
  show_project_cta: boolean;
  chat_retention_hours: number;
  company_profile_url: string;
  company_profile_display: string; // none | floating | header
}

export interface SeoSettings {
  site_title: string;
  meta_description: string;
  keywords: string;
  google_verification: string;
  bing_verification: string;
  analytics_id: string;
  gtm_id: string;
  default_og_image: string;
}

export interface ContactSettings {
  destination_email: string;
  inquiry_email: string;
  quote_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_secure: boolean;
  auto_reply: boolean;
}

export interface AppearanceSettings {
  primary_color: string;
  secondary_color: string;
  dark_mode: string;
}

export interface IntegrationsSettings {
  google_verification: string;
  google_analytics_id: string;
  google_tag_manager_id: string;
  google_maps_url: string;
  google_maps_api_key: string;
}

export interface TeamSettings {
  display_type: "grid" | "slider";
  autoplay: boolean;
  speed: number;
}

const defaults = {
  general: {
    company_name_ar: "سايتكم",
    company_name_en: "Sitekoom",
    tagline_ar: "حلول رقمية تنمو مع أعمالك",
    tagline_en: "Digital solutions that grow with your business",
    email: "hello@sitekoom.com",
    phone: "",
    whatsapp: "",
    whatsapp_message: "مرحباً سايتكم، أود الاستفسار عن خدماتكم",
    address_ar: "عمّان، الأردن",
    address_en: "Amman, Jordan",
    google_maps_url: "",
    google_maps_embed_url: "",
    working_hours_ar: "",
    working_hours_en: "",
    logo: "",
    logo_width_desktop: 170,
    logo_width_tablet: 140,
    logo_width_mobile: 120,
    favicon: "",
    footer_logo: "",
    footer_logo_width_desktop: 140,
    footer_logo_width_tablet: 110,
    footer_logo_width_mobile: 90,
    about_logo_width_desktop: 96,
    about_logo_width_laptop: 84,
    about_logo_width_tablet: 72,
    about_logo_width_mobile: 64,
    show_project_cta: true,
    chat_retention_hours: 24,
    company_profile_url: "",
    company_profile_display: "none",
  } as GeneralSettings,
  seo: {
    site_title: "سايتكم | حلول رقمية",
    meta_description: "",
    keywords: "",
    google_verification: "",
    bing_verification: "",
    analytics_id: "",
    gtm_id: "",
    default_og_image: "",
  } as SeoSettings,
  contact: {
    destination_email: "",
    inquiry_email: "",
    quote_email: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    smtp_secure: false,
    auto_reply: true,
  } as ContactSettings,
  appearance: {
    primary_color: "#7a1aff",
    secondary_color: "#9d72ff",
    dark_mode: "system",
  } as AppearanceSettings,
  integrations: {
    google_verification: "",
    google_analytics_id: "",
    google_tag_manager_id: "",
    google_maps_url: "",
    google_maps_api_key: "",
  } as IntegrationsSettings,
  team: {
    display_type: "grid",
    autoplay: true,
    speed: 5,
  } as TeamSettings,
};

export const getSettings = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  const map: Record<string, unknown> = {};
  (data ?? []).forEach((row) => (map[row.key] = row.value));

  return {
    general: { ...defaults.general, ...((map.general as object) ?? {}) } as GeneralSettings,
    seo: { ...defaults.seo, ...((map.seo as object) ?? {}) } as SeoSettings,
    contact: { ...defaults.contact, ...((map.contact as object) ?? {}) } as ContactSettings,
    appearance: {
      ...defaults.appearance,
      ...((map.appearance as object) ?? {}),
    } as AppearanceSettings,
    integrations: {
      ...defaults.integrations,
      ...((map.integrations as object) ?? {}),
    } as IntegrationsSettings,
    team: {
      ...defaults.team,
      ...((map.team as object) ?? {}),
    } as TeamSettings,
    raw: map,
  };
});

export async function getSettingKey<T>(key: string, fallback: T): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single();
  if (!data) return fallback;
  return (data.value as T) ?? fallback;
}
