import { requirePermission } from "@/lib/admin-guard";
import { OfferForm } from "@/components/admin/offer-form";

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  await requirePermission("offers.manage");
  return <OfferForm offerId={params.id} />;
}
