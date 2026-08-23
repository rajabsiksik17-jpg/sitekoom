import { requirePermission } from "@/lib/admin-guard";
import { ClientsManager } from "@/components/admin/clients-manager";
import { ClientEmail } from "@/components/admin/client-email";

export default async function AdminClientsPage() {
  await requirePermission("clients.view");
  return (
    <div className="space-y-6">
      <ClientEmail />
      <ClientsManager />
    </div>
  );
}
