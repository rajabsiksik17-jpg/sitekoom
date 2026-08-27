import { requirePermission } from "@/lib/admin-guard";
import { OffersManager } from "@/components/admin/offers-manager";

export default async function AdminOffersPage() {
  await requirePermission("offers.view");
  return <OffersManager />;
}
