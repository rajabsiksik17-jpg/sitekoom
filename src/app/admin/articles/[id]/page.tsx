import { requirePermission } from "@/lib/admin-guard";
import { ArticleForm } from "@/components/admin/article-form";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  await requirePermission("articles.manage");
  return <ArticleForm articleId={params.id} />;
}
