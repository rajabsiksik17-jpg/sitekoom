import { requirePermission } from "@/lib/admin-guard";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default async function AdminCategoriesPage() {
  await requirePermission("articles.view");
  return <CategoriesManager />;
}
