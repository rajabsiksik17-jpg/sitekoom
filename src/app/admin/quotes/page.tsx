import { requirePermission } from "@/lib/admin-guard";
import { QuotesManager } from "@/components/admin/quotes-manager";

export default async function AdminQuotesPage() {
  await requirePermission("contacts.view");
  return <QuotesManager />;
}
