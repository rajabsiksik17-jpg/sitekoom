import { requirePermission } from "@/lib/admin-guard";
import { ClientsManager } from "@/components/admin/clients-manager";

export default async function AdminClientsPage() {
  await requirePermission("clients.view");
  return <ClientsManager />;
}
