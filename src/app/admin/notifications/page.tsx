import { requirePermission } from "@/lib/admin-guard";
import { NotificationsPage } from "@/components/admin/notifications-page";

export default async function AdminNotificationsPage() {
  await requirePermission("notifications.view");
  return <NotificationsPage />;
}
