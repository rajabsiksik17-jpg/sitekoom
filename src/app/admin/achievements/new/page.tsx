import { requirePermission } from "@/lib/admin-guard";
import { AchievementForm } from "@/components/admin/achievement-form";

export default async function NewAchievementPage() {
  await requirePermission("achievements.manage");
  return <AchievementForm />;
}
