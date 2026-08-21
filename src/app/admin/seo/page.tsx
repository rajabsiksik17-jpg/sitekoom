import { requirePermission } from "@/lib/admin-guard";
import { SeoManager } from "@/components/admin/seo-manager";

export default async function AdminSeoPage() {
  await requirePermission("seo.view");
  return <SeoManager />;
}
