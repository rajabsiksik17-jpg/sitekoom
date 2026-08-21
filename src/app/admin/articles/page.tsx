import { requirePermission } from "@/lib/admin-guard";
import { ArticlesManager } from "@/components/admin/articles-manager";

export default async function AdminArticlesPage() {
  await requirePermission("articles.view");
  return <ArticlesManager />;
}
