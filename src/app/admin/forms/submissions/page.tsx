import { requirePermission } from "@/lib/admin-guard";
import { FormSubmissionsManager } from "@/components/admin/form-submissions-manager";

export default async function AdminFormSubmissionsPage() {
  await requirePermission("submissions.view");
  return <FormSubmissionsManager />;
}
