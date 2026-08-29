import { requirePermission } from "@/lib/admin-guard";
import { FormBuilder } from "@/components/admin/form-builder";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("forms.manage");
  return <FormBuilder formId={(await params).id} />;
}
