import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface IntroSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  highlight_ar: string;
  highlight_en: string;
  desc_ar: string;
  desc_en: string;
  points_ar: string[];
  points_en: string[];
  cards: string[];
}

export interface ContactIntroSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  points_ar: string[];
  points_en: string[];
}

export interface ContactProcessStep {
  ar: string;
  en: string;
}

export interface ContactProcessSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  steps: ContactProcessStep[];
}

export interface ContentSections {
  homepage_intro: IntroSection;
  contact_intro: ContactIntroSection;
  contact_process: ContactProcessSection;
}

const defaults: ContentSections = {
  homepage_intro: {
    enabled: true,
    title_ar: "نصنع حضورك الرقمي، ونحوّل أفكارك إلى حلول",
    title_en: "We craft your digital presence and turn ideas into solutions",
    highlight_ar: "برمجة متطورة. تصميم استثنائي. نتائج حقيقية.",
    highlight_en: "Advanced code. Exceptional design. Real results.",
    desc_ar: "",
    desc_en: "",
    points_ar: [],
    points_en: [],
    cards: ["Scalable Architecture", "Modern Technology", "High Performance", "Built From Scratch"],
  },
  contact_intro: { enabled: true, title_ar: "", title_en: "", desc_ar: "", desc_en: "", points_ar: [], points_en: [] },
  contact_process: { enabled: true, title_ar: "", title_en: "", desc_ar: "", desc_en: "", steps: [] },
};

export const getContentSections = cache(async (): Promise<ContentSections> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "content_sections").single();
  const raw = (data?.value ?? {}) as Partial<ContentSections>;
  return {
    homepage_intro: { ...defaults.homepage_intro, ...(raw.homepage_intro ?? {}) },
    contact_intro: { ...defaults.contact_intro, ...(raw.contact_intro ?? {}) },
    contact_process: { ...defaults.contact_process, ...(raw.contact_process ?? {}) },
  };
});
