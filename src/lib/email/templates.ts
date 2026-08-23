import type { ContactRequest } from "@/lib/types";

function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Returns the inner card content (wrapped by the master email layout).
export function contactRequestBody(contact: ContactRequest, locale: "ar" | "en"): { subject: string; body: string; text: string } {
  const isAr = locale === "ar";
  const rows: [string, string | null | undefined][] = isAr
    ? [
        ["الاسم", contact.name],
        ["الشركة", contact.company],
        ["البريد الإلكتروني", contact.email],
        ["الهاتف", contact.phone],
        ["الخدمة", contact.service_name],
        ["الميزانية", contact.budget],
        ["مصدر الطلب", contact.source],
        ["الصفحة", contact.source_page],
        ["الرسالة", contact.message],
      ]
    : [
        ["Name", contact.name],
        ["Company", contact.company],
        ["Email", contact.email],
        ["Phone", contact.phone],
        ["Service", contact.service_name],
        ["Budget", contact.budget],
        ["Source", contact.source],
        ["Page", contact.source_page],
        ["Message", contact.message],
      ];

  const subject = `${isAr ? "طلب تواصل جديد" : "New contact request"} — ${contact.service_name ?? contact.source ?? ""}`;

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${rows
        .filter(([, v]) => v)
        .map(
          ([k, v]) => `
        <tr>
          <td style="padding:8px 0;color:#9ca3af;width:150px;vertical-align:top;font-size:13px;">${esc(k)}</td>
          <td style="padding:8px 0;color:#1f2937;font-weight:500;">${esc(v)}</td>
        </tr>`,
        )
        .join("")}
    </table>`;

  const text = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");

  return { subject, body, text };
}

export function autoReplyBody(contact: ContactRequest, locale: "ar" | "en"): { subject: string; body: string } {
  const isAr = locale === "ar";
  const subject = isAr ? "شكراً لتواصلك مع سايتكم" : "Thank you for contacting Sitekoom";
  const body = isAr
    ? `<p style="margin:0 0 12px;font-size:14px;color:#374151;">عزيزي/عزيزتي ${esc(contact.name)}،</p><p style="margin:0 0 12px;font-size:14px;color:#374151;">شكراً لتواصلك معنا. استلمنا طلبك وسيتواصل معك فريقنا في أقرب وقت.</p><p style="margin:0;font-size:14px;color:#374151;">مع خالص التحية،<br/>فريق سايتكم</p>`
    : `<p style="margin:0 0 12px;font-size:14px;color:#374151;">Dear ${esc(contact.name)},</p><p style="margin:0 0 12px;font-size:14px;color:#374151;">Thank you for reaching out. We have received your request and our team will contact you shortly.</p><p style="margin:0;font-size:14px;color:#374151;">Best regards,<br/>The Sitekoom Team</p>`;
  return { subject, body };
}
