import { requirePermission } from "@/lib/admin-guard";
import { SupportReasonsManager } from "@/components/admin/support-reasons-manager";

export default async function AdminSupportReasonsPage() {
  await requirePermission("clients.view");
  return <SupportReasonsManager />;
}
