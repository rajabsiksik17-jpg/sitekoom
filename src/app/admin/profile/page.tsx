import { requireAdmin } from "@/lib/admin-guard";
import { ProfilePage } from "@/components/admin/profile-page";

export default async function AdminProfilePage() {
  await requireAdmin();
  return <ProfilePage />;
}
