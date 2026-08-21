import { requirePermission } from "@/lib/admin-guard";
import { PagesManager } from "@/components/admin/pages-manager";

export default async function AdminPagesPage() {
  await requirePermission("articles.view");
  return <PagesManager />;
}
