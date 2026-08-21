import { requirePermission } from "@/lib/admin-guard";
import { PageForm } from "@/components/admin/page-form";

export default async function NewPagePage() {
  await requirePermission("articles.manage");
  return <PageForm />;
}
