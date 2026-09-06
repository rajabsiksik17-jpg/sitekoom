import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";

const schema = z.object({
  entity: z.enum(["projects", "services"]),
  action: z.string().min(1).max(40),
  ids: z.array(z.string().uuid()).min(1).max(500),
  value: z.string().max(1000).optional().or(z.literal("")),
});

const PERMISSION: Record<string, string> = {
  projects: "projects.manage",
  services: "services.manage",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }

  const required = PERMISSION[body.entity];
  if (!hasPermission(user, required)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const table = body.entity === "projects" ? "projects" : "services";

  try {
    let updated = 0;

    if (body.action === "delete") {
      // Services: guard against deleting services that still have linked projects.
      if (body.entity === "services") {
        const { count } = await admin
          .from("projects")
          .select("id", { count: "exact", head: true })
          .in("service_id", body.ids)
          .is("deleted_at", null);
        if (count && count > 0) {
          return NextResponse.json(
            {
              ok: false,
              blocked: true,
              count,
              error: `يوجد ${count} عمل مرتبط بهذه الخدمات. انقل الأعمال لخدمة أخرى قبل الحذف.`,
            },
            { status: 409 },
          );
        }
      }
      const { error } = await admin.from(table).update({ deleted_at: new Date().toISOString() }).in("id", body.ids);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      updated = body.ids.length;
    } else if (body.action === "change_category") {
      if (!body.value) return NextResponse.json({ ok: false, error: "Missing category" }, { status: 400 });
      const { error } = await admin.from("projects").update({ category_id: body.value }).in("id", body.ids);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      updated = body.ids.length;
    } else if (body.action === "change_service") {
      if (!body.value) return NextResponse.json({ ok: false, error: "Missing service" }, { status: 400 });
      const { error } = await admin.from("projects").update({ service_id: body.value }).in("id", body.ids);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      updated = body.ids.length;
    } else if (body.action === "change_works_image") {
      if (!body.value) return NextResponse.json({ ok: false, error: "Missing image" }, { status: 400 });
      const { error } = await admin.from("services").update({ works_image: body.value }).in("id", body.ids);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      updated = body.ids.length;
    } else if (body.action === "remove_works_image") {
      const { error } = await admin.from("services").update({ works_image: null }).in("id", body.ids);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      updated = body.ids.length;
    } else {
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      actor_name: user.name || user.email,
      action: `bulk_${body.action}`,
      entity_type: body.entity,
      entity_id: body.ids[0],
      description: `${body.action} على ${body.ids.length} ${body.entity === "projects" ? "عمل" : "خدمة"}`,
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
