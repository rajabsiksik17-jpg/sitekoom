import { requirePermission } from "@/lib/admin-guard";
import { AnalyticsPage } from "@/components/admin/analytics-page";

export default async function AdminAnalyticsPage() {
  await requirePermission("analytics.view");
  return <AnalyticsPage />;
}
