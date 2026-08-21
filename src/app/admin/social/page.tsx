import { requirePermission } from "@/lib/admin-guard";
import { SocialManager } from "@/components/admin/social-manager";

export default async function AdminSocialPage() {
  await requirePermission("social.view");
  return <SocialManager />;
}
