// Single source of truth for the portfolio field types the admin can enable
// per service. This is a menu of capabilities, NOT per-service logic — a
// service enables whichever types it needs and the project form renders only
// those. New types can be added here without rebuilding the system.

export type PortfolioKind = "image" | "video" | "file" | "link" | "text" | "media";

export interface PortfolioFieldType {
  key: string;
  labelAr: string;
  labelEn: string;
  kind: PortfolioKind;
  multiple?: boolean; // can have many items
}

export const PORTFOLIO_FIELD_TYPES: PortfolioFieldType[] = [
  { key: "image", labelAr: "صورة", labelEn: "Image", kind: "image" },
  { key: "gallery", labelAr: "معرض صور", labelEn: "Image Gallery", kind: "image", multiple: true },
  { key: "screenshots", labelAr: "لقطات شاشة", labelEn: "Screenshots", kind: "image", multiple: true },
  { key: "device_screenshots", labelAr: "لقطات حسب الجهاز", labelEn: "Device Screenshots", kind: "image", multiple: true },
  { key: "video", labelAr: "فيديو", labelEn: "Video", kind: "video", multiple: true },
  { key: "pdf", labelAr: "ملف PDF", labelEn: "PDF", kind: "file", multiple: true },
  { key: "file", labelAr: "ملف", labelEn: "File", kind: "file", multiple: true },
  { key: "external_link", labelAr: "روابط خارجية", labelEn: "External Links", kind: "link", multiple: true },
  { key: "website_url", labelAr: "رابط الموقع", labelEn: "Website URL", kind: "link" },
  { key: "google_play", labelAr: "Google Play", labelEn: "Google Play", kind: "link" },
  { key: "app_store", labelAr: "Apple App Store", labelEn: "Apple App Store", kind: "link" },
  { key: "social_links", labelAr: "روابط التواصل", labelEn: "Social Links", kind: "link", multiple: true },
  { key: "location", labelAr: "الموقع", labelEn: "Location", kind: "media" },
  { key: "audio", labelAr: "صوت", labelEn: "Audio", kind: "media", multiple: true },
  { key: "heading", labelAr: "عنوان", labelEn: "Heading", kind: "text" },
  { key: "text_block", labelAr: "نص", labelEn: "Text Block", kind: "text", multiple: true },
];

export function portfolioFieldType(key: string): PortfolioFieldType | undefined {
  return PORTFOLIO_FIELD_TYPES.find((t) => t.key === key);
}

export function portfolioTypeLabel(key: string, locale: "ar" | "en"): string {
  const t = portfolioFieldType(key);
  if (!t) return key;
  return locale === "ar" ? t.labelAr : t.labelEn;
}
