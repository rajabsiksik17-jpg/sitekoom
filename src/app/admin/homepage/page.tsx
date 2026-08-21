import { requirePermission } from "@/lib/admin-guard";
import { HomepageContentManager } from "@/components/admin/homepage-manager";

export default async function AdminHomepagePage() {
  await requirePermission("homepage.view");
  return <HomepageContentManager />;
}
