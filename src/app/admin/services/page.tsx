import { requirePermission } from "@/lib/admin-guard";
import { ServicesManager } from "@/components/admin/services-manager";

export default async function AdminServicesPage() {
  await requirePermission("services.view");
  return <ServicesManager />;
}
