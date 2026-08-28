import { requirePermission } from "@/lib/admin-guard";
import { GoogleReviewsManager } from "@/components/admin/google-reviews-manager";

export default async function AdminGoogleReviewsPage() {
  await requirePermission("reviews.view");
  return <GoogleReviewsManager />;
}
