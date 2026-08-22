import { requirePermission } from "@/lib/admin-guard";
import { FooterSettingsManager } from "@/components/admin/footer-settings-manager";

export default async function AdminFooterPage() {
  await requirePermission("settings.view");
  return <FooterSettingsManager />;
}
