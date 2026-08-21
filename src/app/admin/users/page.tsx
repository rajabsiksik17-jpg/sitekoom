import { requirePermission } from "@/lib/admin-guard";
import { UsersManager } from "@/components/admin/users-manager";

export default async function AdminUsersPage() {
  await requirePermission("users.view");
  return <UsersManager />;
}
