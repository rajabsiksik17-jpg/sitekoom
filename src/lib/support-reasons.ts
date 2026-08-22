import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SupportReason {
  value: string;
  ar: string;
  en: string;
}

export const getSupportReasons = cache(async (): Promise<SupportReason[]> => {
  const admin = createAdminClient();
  const { data } = await admin.from("site_settings").select("value").eq("key", "support_reasons").single();
  const items = ((data?.value as { items?: SupportReason[] })?.items ?? []) as SupportReason[];
  return items;
});

export function reasonLabel(reason: SupportReason | undefined, locale: "ar" | "en"): string {
  if (!reason) return "";
  return locale === "ar" ? reason.ar : reason.en;
}
