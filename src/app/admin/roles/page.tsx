import { requirePermission } from "@/lib/admin-guard";
import { RolesManager } from "@/components/admin/roles-manager";

export default async function AdminRolesPage() {
  await requirePermission("roles.view");
  return <RolesManager />;
}
