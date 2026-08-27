import { requirePermission } from "@/lib/admin-guard";
import { OfferForm } from "@/components/admin/offer-form";

export default async function NewOfferPage() {
  await requirePermission("offers.manage");
  return <OfferForm />;
}
