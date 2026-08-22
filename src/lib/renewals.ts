import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmailTemplate } from "@/lib/email/template-service";
import { sendEmail } from "@/lib/email";

interface ServiceRow {
  id: string;
  client_id: string;
  website_id: string | null;
  name: string;
  expiry_date: string | null;
  price: number;
}

type ServiceType = "subscription" | "domain" | "hosting";

const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";

function daysLeft(date: string | null | undefined): number {
  if (!date) return Number.POSITIVE_INFINITY;
  const d = new Date(date);
  if (isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export async function checkDueRenewals(): Promise<{ checked: number; sent: number; errors: number }> {
  const admin = createAdminClient();

  const [subs, domains, hosting] = await Promise.all([
    admin.from("client_subscriptions").select("id, client_id, website_id, plan, expiry_date, renewal_price").not("expiry_date", "is", null),
    admin.from("client_domains").select("id, client_id, website_id, domain_name, expiry_date, renewal_price").not("expiry_date", "is", null),
    admin.from("client_hosting").select("id, client_id, website_id, plan, expiry_date, renewal_price").not("expiry_date", "is", null),
  ]);

  const services: { type: ServiceType; row: ServiceRow }[] = [
    ...((subs.data ?? []) as { id: string; client_id: string; website_id: string | null; plan: string | null; expiry_date: string; renewal_price: number }[]).map((s) => ({ type: "subscription" as ServiceType, row: { id: s.id, client_id: s.client_id, website_id: s.website_id, name: s.plan ?? "Subscription", expiry_date: s.expiry_date, price: Number(s.renewal_price) } })),
    ...((domains.data ?? []) as { id: string; client_id: string; website_id: string | null; domain_name: string; expiry_date: string; renewal_price: number }[]).map((d) => ({ type: "domain" as ServiceType, row: { id: d.id, client_id: d.client_id, website_id: d.website_id, name: d.domain_name, expiry_date: d.expiry_date, price: Number(d.renewal_price) } })),
    ...((hosting.data ?? []) as { id: string; client_id: string; website_id: string | null; plan: string | null; expiry_date: string; renewal_price: number }[]).map((h) => ({ type: "hosting" as ServiceType, row: { id: h.id, client_id: h.client_id, website_id: h.website_id, name: h.plan ?? "Hosting", expiry_date: h.expiry_date, price: Number(h.renewal_price) } })),
  ];

  const clientIds = Array.from(new Set(services.map((s) => s.row.client_id)));
  const { data: clients } = await admin.from("clients").select("id, name, email").in("id", clientIds);
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

  const levels = [90, 30];
  let sent = 0;
  let errors = 0;

  for (const { type, row } of services) {
    const left = daysLeft(row.expiry_date);
    if (left < 0 || left > 90) continue;
    const client = clientMap.get(row.client_id);
    if (!client?.email) continue;

    for (const level of levels) {
      if (left > level) continue;

      // Dedupe: only send each reminder level once per service.
      const { data: existing } = await admin
        .from("renewal_reminders")
        .select("id")
        .eq("service_type", type)
        .eq("service_id", row.id)
        .eq("days_before", level)
        .maybeSingle();
      if (existing) continue;

      try {
        const subjectKey = "renewal_reminder";
        const rendered = await renderEmailTemplate(
          subjectKey,
          {
            name: client.name,
            service: type === "subscription" ? "subscription" : type === "domain" ? "domain" : "hosting",
            site: row.name,
            expiry_date: row.expiry_date ?? "",
            days_left: left,
            amount: row.price,
            portal_url: `${PORTAL_URL}/client-portal/renewals`,
          },
          "ar",
        );

        await sendEmail({
          to: client.email,
          subject: rendered.subject || "Renewal reminder",
          html: rendered.html,
          type: "renewal_reminder",
        });

        await admin.from("client_notifications").insert({
          client_id: row.client_id,
          type: "renewal_reminder",
          title_ar: "تذكير: خدمتك ستنتهي قريبًا",
          title_en: "Reminder: your service is expiring soon",
          body_ar: `${row.name} سينتهي في ${row.expiry_date} (متبقي ${left} يوم).`,
          body_en: `${row.name} will expire on ${row.expiry_date} (${left} days left).`,
          link: "/client-portal/renewals",
        });

        await admin.from("renewal_reminders").insert({
          client_id: row.client_id,
          service_type: type,
          service_id: row.id,
          due_date: row.expiry_date,
          days_before: level,
        });

        await admin.from("notifications").insert({
          user_id: null,
          type: "renewal_reminder",
          title_ar: "تذكير تجديد تلقائي",
          title_en: "Automatic renewal reminder",
          body_ar: `تم إرسال تذكير تجديد (${level} يوم) إلى ${client.name}.`,
          body_en: `A ${level}-day renewal reminder was sent to ${client.name}.`,
          link: "/admin/clients",
        });

        sent++;
      } catch {
        errors++;
      }
    }
  }

  return { checked: services.length, sent, errors };
}
