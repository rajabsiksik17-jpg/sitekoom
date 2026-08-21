import { requirePermission } from "@/lib/admin-guard";
import { ProjectsManager } from "@/components/admin/projects-manager";

export default async function AdminProjectsPage() {
  await requirePermission("projects.view");
  return <ProjectsManager />;
}
