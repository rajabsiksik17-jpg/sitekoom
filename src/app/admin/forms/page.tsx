import { requirePermission } from "@/lib/admin-guard";
import { FormsManager } from "@/components/admin/forms-manager";

export default async function AdminFormsPage() {
  await requirePermission("forms.view");
  return <FormsManager />;
}
