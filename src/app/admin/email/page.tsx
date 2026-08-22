import { requirePermission } from "@/lib/admin-guard";
import { EmailSettingsManager } from "@/components/admin/email-settings-manager";

export default async function AdminEmailSettingsPage() {
  await requirePermission("settings.view");
  return <EmailSettingsManager />;
}
