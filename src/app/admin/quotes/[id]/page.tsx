import { requirePermission } from "@/lib/admin-guard";
import { QuoteDetail } from "@/components/admin/quote-detail";

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("contacts.view");
  return <QuoteDetail id={(await params).id} />;
}
