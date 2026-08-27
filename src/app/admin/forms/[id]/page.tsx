import { requirePermission } from "@/lib/admin-guard";
import { FormBuilder } from "@/components/admin/form-builder";

export default async function EditFormPage({ params }: { params: { id: string } }) {
  await requirePermission("forms.manage");
  return <FormBuilder formId={params.id} />;
}
