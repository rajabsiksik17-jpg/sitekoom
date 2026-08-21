import { requirePermission } from "@/lib/admin-guard";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({ params }: { params: { id: string } }) {
  await requirePermission("services.manage");
  return <ServiceForm serviceId={params.id} />;
}
