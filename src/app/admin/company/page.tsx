import { requirePermission } from "@/lib/admin-guard";
import { CompanyManager } from "@/components/admin/company-manager";

export default async function AdminCompanyPage() {
  await requirePermission("company.view");
  return <CompanyManager />;
}
