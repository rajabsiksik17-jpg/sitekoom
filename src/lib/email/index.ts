import "server-only";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
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

const smtpProvider: EmailProvider = {
  async send(payload) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? "Sitekoom <no-reply@sitekoom.com>",
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

function resolveProvider(): EmailProvider {
  switch (process.env.EMAIL_PROVIDER) {
    case "resend":
      return resendProvider;
    case "smtp":
      return smtpProvider;
    case "console":
    default:
      return consoleProvider;
  }
}

export async function sendEmail(payload: EmailPayload) {
  const provider = resolveProvider();
  return provider.send(payload);
}
