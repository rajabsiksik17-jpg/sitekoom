import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

interface SiteInfo {
  companyName: string;
  logo: string | null;
  phone: string;
  email: string;
  siteUrl: string;
  social: { label: string; url: string }[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";

async function loadSiteInfo(locale: "ar" | "en"): Promise<SiteInfo> {
  const admin = createAdminClient();
  const [{ data: generalRow }, { data: socialRows }] = await Promise.all([
    admin.from("site_settings").select("value").eq("key", "general").single(),
    admin.from("social_links").select("label, platform, url").eq("is_active", true).order("sort"),
  ]);
  const g = (generalRow?.value ?? {}) as {
    company_name_ar?: string;
    company_name_en?: string;
    logo?: string;
    phone?: string;
    email?: string;
  };
  const social = (socialRows ?? []).map((s) => ({ label: s.label || s.platform, url: s.url }));
  return {
    companyName: (locale === "ar" ? g.company_name_ar : g.company_name_en) || "Sitekoom",
    logo: g.logo ?? null,
    phone: g.phone ?? "",
    email: g.email ?? "",
    siteUrl: SITE_URL,
    social,
  };
}

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Master email layout. All system emails go through this so branding, logo,
 * contact info and social links stay dynamic and consistent.
 */
export async function renderEmailShell(opts: {
  locale: "ar" | "en";
  title: string;
  body: string; // inner HTML (already localized)
}): Promise<{ html: string; text: string }> {
  const info = await loadSiteInfo(opts.locale);
  const isAr = opts.locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const align = isAr ? "right" : "left";

  const logoBlock = info.logo
    ? `<img src="${esc(info.logo)}" alt="${esc(info.companyName)}" height="64" style="height:64px;width:auto;display:inline-block;vertical-align:middle;border:0;" />`
    : `<span style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:16px;background:#7a1aff;color:#ffffff;font-size:26px;font-weight:800;text-align:center;vertical-align:middle;">S</span>`;

  const socialLinks = info.social
    .map(
      (s) =>
        `<a href="${esc(s.url)}" style="display:inline-block;min-width:34px;height:34px;line-height:34px;padding:0 10px;margin:0 4px 6px;border-radius:17px;background:#f1e9ff;color:#7a1aff;text-decoration:none;font-size:12px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${esc(s.label)}</a>`,
    )
    .join("");

  const footerRows = [
    info.phone ? `<span style="display:inline-block;margin:0 8px 6px;color:#6b7280;font-size:12px;" dir="ltr">${esc(info.phone)}</span>` : "",
    info.email ? `<span style="display:inline-block;margin:0 8px 6px;color:#6b7280;font-size:12px;" dir="ltr">${esc(info.email)}</span>` : "",
    `<a href="${esc(info.siteUrl)}" style="display:inline-block;margin:0 8px 6px;color:#7a1aff;text-decoration:none;font-size:12px;" dir="ltr">${esc(info.siteUrl.replace(/^https?:\/\//, ""))}</a>`,
  ]
    .filter(Boolean)
    .join('<span style="color:#d1d5db;font-size:12px;">&bull;</span>');

  const year = new Date().getFullYear();
  const copyright = isAr ? `جميع الحقوق محفوظة © ${year} ${esc(info.companyName)}` : `All rights reserved © ${year} ${esc(info.companyName)}`;

  const html = `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0fb;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ede9f7;">

        <tr>
          <td align="center" style="padding:28px 32px 8px;background-color:#ffffff;">
            ${logoBlock}
          </td>
        </tr>

        <tr>
          <td style="padding:32px 32px 8px;text-align:${align};" dir="${dir}">
            <h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">${esc(opts.title)}</h1>
            ${opts.body}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 32px;text-align:${align};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #f0eafa;padding-top:20px;"></td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:#faf8ff;padding:24px 32px;">
            ${socialLinks ? `<div style="margin-bottom:14px;">${socialLinks}</div>` : ""}
            <div style="margin-bottom:6px;">${footerRows}</div>
            <p style="margin:0;color:#9ca3af;font-size:11px;">${copyright}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = `${opts.title}\n\n${opts.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n\n${esc(info.companyName)}\n${esc(info.siteUrl)}`;

  return { html, text };
}
