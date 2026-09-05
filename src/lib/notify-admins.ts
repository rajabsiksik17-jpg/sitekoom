import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSiteEmail } from "@/lib/email/send";

/**
 * Email every active admin whose permissions include the given permission key
 * (either via role or a user-level override) and who has email notifications
 * enabled. Deny overrides are respected. Fails silently (never breaks request flow).
 */
export async function notifyAdminsByPermission(
  permission: string,
  opts: { subject: string; title: string; body: string; locale?: "ar" | "en"; type?: string },
) {
  const admin = createAdminClient();

  const [{ data: rolePerms }, { data: userPerms }] = await Promise.all([
    admin.from("role_permissions").select("role_id").eq("permission_key", permission),
    admin.from("user_permissions").select("user_id, allowed").eq("permission_key", permission),
  ]);

  const roleIds = (rolePerms ?? []).map((r) => r.role_id);
  const grantedIds = (userPerms ?? []).filter((u) => u.allowed === true).map((u) => u.user_id);
  const denied = new Set((userPerms ?? []).filter((u) => u.allowed === false).map((u) => u.user_id));

  const base = admin.from("users").select("id, email, name").eq("status", "active").eq("notify_email", true).is("deleted_at", null);

  const [roleUsers, grantUsers] = await Promise.all([
    roleIds.length ? base.in("role_id", roleIds) : { data: [] as { id: string; email: string | null; name: string }[] },
    grantedIds.length ? base.in("id", grantedIds) : { data: [] as { id: string; email: string | null; name: string }[] },
  ]);

  const map = new Map<string, string>();
  for (const u of [...(roleUsers.data ?? []), ...(grantUsers.data ?? [])]) {
    if (denied.has(u.id) || !u.email) continue;
    map.set(u.id, u.email);
  }

  for (const email of map.values()) {
    await sendSiteEmail({
      to: email,
      subject: opts.subject,
      locale: opts.locale ?? "ar",
      type: opts.type ?? "notification",
      title: opts.title,
      body: opts.body,
    }).catch(() => null);
  }
}
