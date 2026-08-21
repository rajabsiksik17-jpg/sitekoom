import { requirePermission } from "@/lib/admin-guard";
import { ServiceForm } from "@/components/admin/service-form";

export default async function NewServicePage() {
  await requirePermission("services.manage");
  return <ServiceForm />;
}
