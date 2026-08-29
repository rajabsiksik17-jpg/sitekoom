import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { GoogleReview } from "@/lib/types";

export interface GoogleReviewsSettings {
  enabled: boolean;
  count: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  maps_url: string;
  google_maps_uri: string;
  place_name: string;
  cache_hours: number;
  rating: number;
  total: number;
}

const defaults: GoogleReviewsSettings = {
  enabled: true,
  count: 6,
  title_ar: "آراء عملائنا تصنع فرقنا",
  title_en: "Our Clients Are Our Best Work",
  description_ar: "عملاؤنا هم أهم أعمالنا، وتجاربهم هي أفضل شهادة على جودة ما نقدمه.",
  description_en: "Our clients are at the heart of everything we do. Discover what they say about their experience with Sitekoom.",
  maps_url: "",
  google_maps_uri: "",
  place_name: "",
  cache_hours: 24,
  rating: 0,
  total: 0,
};

export const getGoogleReviewsSettings = cache(async (): Promise<GoogleReviewsSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "google_reviews").single();
  return { ...defaults, ...((data?.value as Partial<GoogleReviewsSettings>) ?? {}) };
});

export const getGoogleReviews = cache(async (limit?: number): Promise<GoogleReview[]> => {
  const supabase = await createClient();
  let q = supabase.from("google_reviews").select("*").eq("is_active", true).order("sort").order("created_at");
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as GoogleReview[];
});
