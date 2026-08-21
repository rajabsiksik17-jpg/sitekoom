import { requirePermission } from "@/lib/admin-guard";
import { ContactsManager } from "@/components/admin/contacts-manager";

export default async function AdminContactsPage() {
  await requirePermission("contacts.view");
  return <ContactsManager />;
}
