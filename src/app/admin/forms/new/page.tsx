import { requirePermission } from "@/lib/admin-guard";
import { FormBuilder } from "@/components/admin/form-builder";

export default async function NewFormPage() {
  await requirePermission("forms.manage");
  return <FormBuilder />;
}
