import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailSettings } from "@/lib/email/settings";
import { sendEmail } from "@/lib/email";

/**
 * Resolve the admin notification inbox dynamically:
 *   Settings → Company → Email Notifications (site_settings "email" key)
 *   fallback → contact.destination_email → general.email → EMAIL_FROM.
 * Never hardcoded.
 */
export async function getAdminNotificationEmail(): Promise<string | null> {
  const email = await getEmailSettings();
  if (email.notification_email) return email.notification_email;

  const admin = createAdminClient();
  const { data: contactRow } = await admin.from("site_settings").select("value").eq("key", "contact").single();
  const dest = (contactRow?.value as { destination_email?: string })?.destination_email;
  if (dest) return dest;

  const { data: generalRow } = await admin.from("site_settings").select("value").eq("key", "general").single();
  const generalEmail = (generalRow?.value as { email?: string })?.email;
  if (generalEmail) return generalEmail;

  return process.env.EMAIL_FROM ?? null;
}

/**
 * Send an administrative notification email for a typed event. Extensible —
 * add new notification types without rebuilding the email system.
 */
export async function notifyAdminEmail(opts: {
  type: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const to = await getAdminNotificationEmail();
  if (!to) return;
  await sendEmail({ to, subject: opts.subject, html: opts.html, text: opts.text, type: opts.type }).catch(() => null);
}
