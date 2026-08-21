import { requirePermission } from "@/lib/admin-guard";
import { TeamManager } from "@/components/admin/team-manager";

export default async function AdminTeamPage() {
  await requirePermission("company.view");
  return <TeamManager />;
}
