import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission, type AuthProfile } from "@/lib/auth";

export async function requireAdmin(): Promise<AuthProfile> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.status === "disabled") redirect("/admin/login?error=disabled");
  return user;
}

export async function requirePermission(permission: string): Promise<AuthProfile> {
  const user = await requireAdmin();
  if (!hasPermission(user, permission)) redirect("/admin/unauthorized");
  return user;
}
