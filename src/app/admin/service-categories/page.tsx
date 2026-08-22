import { requirePermission } from "@/lib/admin-guard";
import { ServiceCategoriesManager } from "@/components/admin/service-categories-manager";

export default async function AdminServiceCategoriesPage() {
  await requirePermission("services.view");
  return <ServiceCategoriesManager />;
}
