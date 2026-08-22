import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailSettings } from "@/lib/email/settings";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ ok: boolean; error?: string }>;
}

const consoleProvider: EmailProvider = {
  async send(payload) {
    console.log(`\n── EMAIL (console provider) ──────────────────────────`);
    console.log(`To: ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Text: ${payload.text ?? "(none)"}`);
    console.log(`HTML: ${payload.html.slice(0, 500)}...`);
    console.log(`──────────────────────────────────────────────────────\n`);
    return { ok: true };
  },
};

const resendProvider: EmailProvider = {
  async send(payload) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "Sitekoom <no-reply@sitekoom.com>",
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: body };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "resend error" };
    }
  },
};

async function smtpProviderWith(config: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
}): Promise<EmailProvider> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: config.host,
    port: config.port ?? 587,
    secure: config.secure ?? false,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  return {
    async send(payload) {
      try {
        await transporter.sendMail({
          from: config.from ?? "Sitekoom <no-reply@sitekoom.com>",
          to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "smtp error" };
      }
    },
  };
}

async function resolveProvider(): Promise<EmailProvider> {
  // Prefer SMTP settings stored in the database (dynamic admin configuration).
  const settings = await getEmailSettings();
  if (settings.smtp_host && settings.smtp_username && settings.smtp_password) {
    return smtpProviderWith({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_encryption === "ssl",
      user: settings.smtp_username,
      pass: settings.smtp_password,
      from: `${settings.from_name} <${settings.from_email}>`,
    });
  }

  switch (process.env.EMAIL_PROVIDER) {
    case "resend":
      return resendProvider;
    case "smtp":
      return smtpProviderWith({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.EMAIL_FROM,
      });
    case "console":
    default:
      return consoleProvider;
  }
}

async function log(recipient: string, subject: string, type: string | undefined, result: { ok: boolean; error?: string }) {
  try {
    const admin = createAdminClient();
    await admin.from("email_logs").insert({
      type: type ?? null,
      recipient,
      subject,
      status: result.ok ? "sent" : "failed",
      error: result.error ?? null,
    });
  } catch {
    // logging must never break sending
  }
}

export async function sendEmail(payload: EmailPayload) {
  const provider = await resolveProvider();
  const result = await provider.send(payload);
  const recipient = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;
  await log(recipient, payload.subject, payload.type, result);
  return result;
}
