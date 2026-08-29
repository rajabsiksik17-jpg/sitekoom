import { requirePermission } from "@/lib/admin-guard";
import { OfferForm } from "@/components/admin/offer-form";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("offers.manage");
  return <OfferForm offerId={(await params).id} />;
}
