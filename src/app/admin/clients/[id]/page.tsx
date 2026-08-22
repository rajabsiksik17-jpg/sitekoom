import { requirePermission } from "@/lib/admin-guard";
import { ClientDetailManager } from "@/components/admin/client-detail-manager";

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("clients.view");
  return <ClientDetailManager clientId={params.id} />;
}
