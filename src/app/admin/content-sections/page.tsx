import { requirePermission } from "@/lib/admin-guard";
import { ContentSectionsManager } from "@/components/admin/content-sections-manager";

export default async function AdminContentSectionsPage() {
  await requirePermission("homepage.view");
  return <ContentSectionsManager />;
}
