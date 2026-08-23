import "server-only";

import { sendEmail } from "@/lib/email";
import { renderEmailShell } from "@/lib/email/layout";

/**
 * Send a branded email using the central master template. All system emails
 * should use this so logo, contact info and social links stay dynamic.
 */
export async function sendSiteEmail(opts: {
  to: string | string[];
  subject: string;
  locale: "ar" | "en";
  type?: string;
  title: string;
  body: string; // inner card HTML
}) {
  const { html, text } = await renderEmailShell({ locale: opts.locale, title: opts.title, body: opts.body });
  return sendEmail({ to: opts.to, subject: opts.subject, html, text, type: opts.type });
}
