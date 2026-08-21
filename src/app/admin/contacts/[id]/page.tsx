import { requirePermission } from "@/lib/admin-guard";
import { ContactDetail } from "@/components/admin/contact-detail";

export default async function AdminContactDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("contacts.view");
  return <ContactDetail id={params.id} />;
}
