import { requirePermission } from "@/lib/admin-guard";
import { StatisticsManager } from "@/components/admin/statistics-manager";

export default async function AdminStatisticsPage() {
  await requirePermission("company.view");
  return <StatisticsManager />;
}
