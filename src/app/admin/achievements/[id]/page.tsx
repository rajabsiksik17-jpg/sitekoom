import { requirePermission } from "@/lib/admin-guard";
import { AchievementForm } from "@/components/admin/achievement-form";

export default async function EditAchievementPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("achievements.manage");
  return <AchievementForm achievementId={(await params).id} />;
}
