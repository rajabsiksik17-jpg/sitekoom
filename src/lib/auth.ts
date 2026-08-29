import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Permission, Role, User } from "@/lib/types";

export interface AuthProfile extends User {
  role: Role | null;
  permissions: string[];
}

async function loadProfile(userId: string): Promise<AuthProfile | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*, role:roles(*)")
    .eq("id", userId)
    .is("deleted_at", null)
    .single();

  if (error || !user) return null;

  let permissions: string[] = [];
  if (user.role?.is_super) {
    const { data: all } = await supabase.from("permissions").select("key");
    permissions = (all ?? []).map((p) => p.key);
  } else {
    const [{ data: rolePerms }, { data: userPerms }] = await Promise.all([
      supabase
        .from("role_permissions")
        .select("permission_key")
        .eq("role_id", user.role_id),
      supabase
        .from("user_permissions")
        .select("permission_key, allowed")
        .eq("user_id", userId),
    ]);

    const denied = new Set(
      (userPerms ?? []).filter((u) => u.allowed === false).map((u) => u.permission_key),
    );
    const granted = new Set(
      (userPerms ?? []).filter((u) => u.allowed === true).map((u) => u.permission_key),
    );

    const set = new Set<string>();
    (rolePerms ?? []).forEach((r) => set.add(r.permission_key));
    granted.forEach((g) => set.add(g));
    denied.forEach((d) => set.delete(d));
    permissions = Array.from(set);
  }

  return { ...(user as User), role: user.role as Role | null, permissions };
}

export const getCurrentUser = cache(async (): Promise<AuthProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return loadProfile(user.id);
});

export function hasPermission(profile: AuthProfile | null, permission: string): boolean {
  if (!profile) return false;
  if (profile.role?.is_super) return true;
  return profile.permissions.includes(permission);
}

export async function getPermissionsList(): Promise<Permission[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("permissions").select("*").order("sort");
  return (data ?? []) as Permission[];
}
