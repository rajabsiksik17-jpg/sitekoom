import { requirePermission } from "@/lib/admin-guard";
import { PageForm } from "@/components/admin/page-form";

export default async function EditPagePage({ params }: { params: { id: string } }) {
  await requirePermission("articles.manage");
  return <PageForm pageId={params.id} />;
}
