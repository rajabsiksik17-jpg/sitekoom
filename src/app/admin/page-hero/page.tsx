import { requirePermission } from "@/lib/admin-guard";
import { PageHeroManager } from "@/components/admin/page-hero-manager";

export default async function AdminPageHeroPage() {
  await requirePermission("homepage.view");
  return <PageHeroManager />;
}
