import { requirePermission } from "@/lib/admin-guard";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  await requirePermission("projects.manage");
  return <ProjectForm projectId={params.id} />;
}
