import { requirePermission } from "@/lib/admin-guard";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("services.manage");
  return <ServiceForm serviceId={(await params).id} />;
}
