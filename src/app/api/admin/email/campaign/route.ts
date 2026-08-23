import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { sendSiteEmail } from "@/lib/email/send";

const schema = z.object({
  client_ids: z.array(z.string().uuid()),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "clients.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: clients } = await admin
    .from("clients")
    .select("id, name, email, preferred_language")
    .in("id", body.client_ids)
    .is("deleted_at", null);

  const list = clients ?? [];
  const { data: campaign, error } = await admin
    .from("email_campaigns")
    .insert({
      sender_id: user.id,
      subject: body.subject,
      recipients_count: list.length,
      status: "sent",
    })
    .select("id")
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  let success = 0;
  let failed = 0;

  for (const client of list) {
    if (!client.email) {
      failed++;
      await admin.from("email_campaign_recipients").insert({
        campaign_id: campaign.id,
        client_id: client.id,
        recipient: client.email ?? "",
        status: "failed",
        error: "No email",
      });
      continue;
    }

    const locale = client.preferred_language === "en" ? "en" : "ar";
    const isAr = locale === "ar";
    const result = await sendSiteEmail({
      to: client.email,
      subject: body.subject,
      locale,
      type: "campaign",
      title: body.subject,
      body: body.body,
    }).catch((e) => ({ ok: false, error: e instanceof Error ? e.message : "failed" }));

    if (result.ok) {
      success++;
      await admin.from("email_campaign_recipients").insert({
        campaign_id: campaign.id,
        client_id: client.id,
        recipient: client.email,
        status: "sent",
      });
    } else {
      failed++;
      await admin.from("email_campaign_recipients").insert({
        campaign_id: campaign.id,
        client_id: client.id,
        recipient: client.email,
        status: "failed",
        error: result.error ?? null,
      });
    }
  }

  await admin.from("email_campaigns").update({ success_count: success, failed_count: failed }).eq("id", campaign.id);

  return NextResponse.json({ ok: true, campaignId: campaign.id, success, failed });
}
