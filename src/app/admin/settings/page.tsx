import { requirePermission } from "@/lib/admin-guard";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  await requirePermission("settings.view");
  return <SettingsManager />;
}
