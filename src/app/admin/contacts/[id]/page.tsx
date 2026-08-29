import { requirePermission } from "@/lib/admin-guard";
import { ContactDetail } from "@/components/admin/contact-detail";

export default async function AdminContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("contacts.view");
  return <ContactDetail id={(await params).id} />;
}
