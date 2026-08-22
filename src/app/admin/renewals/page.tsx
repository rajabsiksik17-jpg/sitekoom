import { requirePermission } from "@/lib/admin-guard";
import { RenewalsManager } from "@/components/admin/renewals-manager";

export default async function AdminRenewalsPage() {
  await requirePermission("clients.view");
  return <RenewalsManager />;
}
