import { requirePermission } from "@/lib/admin-guard";
import { VideosManager } from "@/components/admin/videos-manager";

export default async function AdminClientVideosPage() {
  await requirePermission("clients.view");
  return <VideosManager />;
}
