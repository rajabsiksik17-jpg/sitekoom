import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailTemplate } from "@/lib/types";

export function renderTemplate(
  template: { subject_ar?: string | null; subject_en?: string | null; body_ar?: string | null; body_en?: string | null },
  vars: Record<string, string | number>,
  locale: "ar" | "en",
): { subject: string; html: string } {
  const subject = locale === "ar" ? template.subject_ar ?? template.subject_en ?? "" : template.subject_en ?? template.subject_ar ?? "";
  const body = locale === "ar" ? template.body_ar ?? template.body_en ?? "" : template.body_en ?? template.body_ar ?? "";

  const replace = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

  return { subject: replace(subject), html: replace(body) };
}

export async function getEmailTemplate(key: string): Promise<EmailTemplate | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("email_templates").select("*").eq("key", key).single();
  return (data as EmailTemplate) ?? null;
}

export async function renderEmailTemplate(
  key: string,
  vars: Record<string, string | number>,
  locale: "ar" | "en",
): Promise<{ subject: string; html: string }> {
  const template = await getEmailTemplate(key);
  if (!template) return { subject: "", html: "" };
  return renderTemplate(template, vars, locale);
}
