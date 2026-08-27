import { requirePermission } from "@/lib/admin-guard";
import { AchievementsManager } from "@/components/admin/achievements-manager";

export default async function AdminAchievementsPage() {
  await requirePermission("achievements.view");
  return <AchievementsManager />;
}
