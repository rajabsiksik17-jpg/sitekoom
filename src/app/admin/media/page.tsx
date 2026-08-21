import { requirePermission } from "@/lib/admin-guard";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function AdminMediaPage() {
  await requirePermission("media.view");
  return <MediaLibrary />;
}
