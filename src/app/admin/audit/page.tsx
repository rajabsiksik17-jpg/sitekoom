import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/admin-guard";
import { PageTitle } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requirePermission("audit.view");
  const supabase = createClient();
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  const logs = (data ?? []) as AuditLog[];

  return (
    <div>
      <PageTitle title="سجل النشاطات" description="تتبع التعديلات والعمليات." />

      {logs.length === 0 ? (
        <p className="py-16 text-center text-gray-500">لا توجد نشاطات.</p>
      ) : (
        <div className="card divide-y divide-brand-50">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-3 p-4">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{l.action}</span>
              <div className="flex-1">
                <p className="text-sm text-ink-900">{l.description}</p>
                <p className="text-xs text-gray-400">{l.actor_name} • {formatDateTime(l.created_at, "ar")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
