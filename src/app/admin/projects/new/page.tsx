import { requirePermission } from "@/lib/admin-guard";
import { ProjectForm } from "@/components/admin/project-form";

export default async function NewProjectPage() {
  await requirePermission("projects.manage");
  return <ProjectForm />;
}
