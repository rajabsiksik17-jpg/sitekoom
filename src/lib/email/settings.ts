import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmailSettings {
  notification_email: string;
  from_name: string;
  from_email: string;
  otp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_encryption: string;
}

const defaults: EmailSettings = {
  notification_email: "",
  from_name: "Sitekoom",
  from_email: "no-reply@sitekoom.com",
  otp_enabled: false,
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  smtp_encryption: "tls",
  imap_host: "",
  imap_port: 993,
  imap_username: "",
  imap_password: "",
  imap_encryption: "ssl",
};

export const getEmailSettings = cache(async (): Promise<EmailSettings> => {
  const admin = createAdminClient();
  const { data } = await admin.from("site_settings").select("value").eq("key", "email").single();
  return { ...defaults, ...((data?.value as Partial<EmailSettings>) ?? {}) };
});

export function isSmtpConfigured(settings: EmailSettings): boolean {
  return Boolean(settings.smtp_host && settings.smtp_username && settings.smtp_password);
}
