import { requirePermission } from "@/lib/admin-guard";
import { AchievementForm } from "@/components/admin/achievement-form";

export default async function EditAchievementPage({ params }: { params: { id: string } }) {
  await requirePermission("achievements.manage");
  return <AchievementForm achievementId={params.id} />;
}
