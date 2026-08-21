import type { ContactRequest } from "@/lib/types";

function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function contactRequestEmail(contact: ContactRequest, locale: "ar" | "en"): { subject: string; html: string; text: string } {
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

  const title = isAr ? "طلب تواصل جديد" : "New contact request";
  const subject = `${title} — ${contact.service_name ?? contact.source ?? ""}`;

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:20px;color:#fff">
        <h2 style="margin:0">${esc(contact.name)}</h2>
        <p style="margin:4px 0 0;opacity:.85">${isAr ? "أرسل طلب تواصل جديداً" : "submitted a new contact request"}</p>
      </div>
      <div style="padding:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${rows
            .filter(([, v]) => v)
            .map(
              ([k, v]) => `
              <tr>
                <td style="padding:8px 0;color:#888;width:140px;vertical-align:top">${esc(k)}</td>
                <td style="padding:8px 0;color:#111;font-weight:500">${esc(v)}</td>
              </tr>`,
            )
            .join("")}
        </table>
        <p style="margin-top:16px;font-size:12px;color:#999">
          ${isAr ? "التاريخ" : "Date"}: ${new Date(contact.created_at).toLocaleString(isAr ? "ar-JO" : "en-US")}
        </p>
      </div>
    </div>`;

  const text = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");

  return { subject, html, text };
}

export function autoReplyEmail(contact: ContactRequest, locale: "ar" | "en"): { subject: string; html: string } {
  const isAr = locale === "ar";
  const subject = isAr ? "شكراً لتواصلك مع سايتكم" : "Thank you for contacting Sitekoom";
  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7a1aff,#9d72ff);padding:24px;color:#fff;text-align:center">
        <h1 style="margin:0;font-size:22px">${isAr ? "سايتكم" : "Sitekoom"}</h1>
      </div>
      <div style="padding:24px;line-height:1.7;color:#333">
        <p>${isAr ? `عزيزي/عزيزتي ${esc(contact.name)}،` : `Dear ${esc(contact.name)},`}</p>
        <p>${isAr ? "شكراً لتواصلك معنا. استلمنا طلبك وسيتواصل معك فريقنا في أقرب وقت." : "Thank you for reaching out. We have received your request and our team will contact you shortly."}</p>
        <p>${isAr ? "مع خالص التحية،" : "Best regards,"}<br/>${isAr ? "فريق سايتكم" : "The Sitekoom Team"}</p>
      </div>
    </div>`;
  return { subject, html };
}
