import { requirePermission } from "@/lib/admin-guard";
import { IntegrationsManager } from "@/components/admin/integrations-manager";

export default async function AdminIntegrationsPage() {
  await requirePermission("integrations.view");
  return <IntegrationsManager />;
}
