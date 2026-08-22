"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/client-utils";
import type { Client, RenewalRequest } from "@/lib/types";

type Tab = "websites" | "subscriptions" | "domains" | "hosting" | "renewals";

const tabs: { key: Tab; label: string }[] = [
  { key: "websites", label: "المواقع" },
  { key: "subscriptions", label: "الاشتراكات" },
  { key: "domains", label: "الدومينات" },
  { key: "hosting", label: "الاستضافة" },
  { key: "renewals", label: "طلبات التجديد" },
];

interface EntityConfig {
  table: string;
  label: string;
  empty: Record<string, unknown>;
  columns: { key: string; label: string; ltr?: boolean }[];
  fields: { key: string; label: string; type?: "text" | "date" | "number" | "select"; options?: string[] }[];
}

const configs: Record<Exclude<Tab, "renewals">, EntityConfig> = {
  websites: {
    table: "client_websites",
    label: "موقع",
    empty: { name: "", domain: "", website_url: "", admin_url: "", website_type: "wordpress", status: "active" },
    columns: [
      { key: "name", label: "الاسم" },
      { key: "domain", label: "الدومين", ltr: true },
      { key: "website_type", label: "النوع" },
      { key: "status", label: "الحالة" },
    ],
    fields: [
      { key: "name", label: "اسم الموقع" },
      { key: "domain", label: "الدومين" },
      { key: "website_url", label: "رابط الموقع" },
      { key: "admin_url", label: "رابط لوحة التحكم" },
      { key: "website_type", label: "نوع الموقع", type: "select", options: ["wordpress", "woocommerce", "custom", "laravel", "dotnet", "other"] },
      { key: "status", label: "الحالة", type: "select", options: ["active", "maintenance", "suspended"] },
    ],
  },
  subscriptions: {
    table: "client_subscriptions",
    label: "اشتراك",
    empty: { plan: "", start_date: "", expiry_date: "", renewal_duration: "1 year", renewal_price: 0, status: "active" },
    columns: [
      { key: "plan", label: "الخطة" },
      { key: "expiry_date", label: "تاريخ الانتهاء" },
      { key: "renewal_price", label: "قيمة التجديد" },
      { key: "status", label: "الحالة" },
    ],
    fields: [
      { key: "plan", label: "الخطة" },
      { key: "renewal_duration", label: "مدة التجديد" },
      { key: "start_date", label: "تاريخ البداية", type: "date" },
      { key: "expiry_date", label: "تاريخ الانتهاء", type: "date" },
      { key: "renewal_price", label: "قيمة التجديد", type: "number" },
      { key: "status", label: "الحالة", type: "select", options: ["active", "expiring", "renewal_requested", "renewed", "expired", "suspended"] },
    ],
  },
  domains: {
    table: "client_domains",
    label: "دومين",
    empty: { domain_name: "", registration_date: "", expiry_date: "", renewal_period: "1 year", renewal_price: 0, status: "active" },
    columns: [
      { key: "domain_name", label: "الدومين", ltr: true },
      { key: "expiry_date", label: "تاريخ الانتهاء" },
      { key: "renewal_price", label: "قيمة التجديد" },
      { key: "status", label: "الحالة" },
    ],
    fields: [
      { key: "domain_name", label: "الدومين" },
      { key: "renewal_period", label: "مدة التجديد" },
      { key: "registration_date", label: "تاريخ التسجيل", type: "date" },
      { key: "expiry_date", label: "تاريخ الانتهاء", type: "date" },
      { key: "renewal_price", label: "قيمة التجديد", type: "number" },
      { key: "status", label: "الحالة", type: "select", options: ["active", "expiring", "expired", "renewal_requested", "renewed", "suspended"] },
    ],
  },
  hosting: {
    table: "client_hosting",
    label: "استضافة",
    empty: { provider: "", plan: "", start_date: "", expiry_date: "", renewal_period: "1 year", renewal_price: 0, status: "active" },
    columns: [
      { key: "plan", label: "الخطة" },
      { key: "provider", label: "المزود" },
      { key: "expiry_date", label: "تاريخ الانتهاء" },
      { key: "status", label: "الحالة" },
    ],
    fields: [
      { key: "plan", label: "الخطة" },
      { key: "provider", label: "المزود" },
      { key: "renewal_period", label: "مدة التجديد" },
      { key: "start_date", label: "تاريخ البداية", type: "date" },
      { key: "expiry_date", label: "تاريخ الانتهاء", type: "date" },
      { key: "renewal_price", label: "قيمة التجديد", type: "number" },
      { key: "status", label: "الحالة", type: "select", options: ["active", "expiring", "expired", "renewal_requested", "renewed", "suspended"] },
    ],
  },
};

export function ClientDetailManager({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [tab, setTab] = useState<Tab>("websites");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<Tab, unknown[]>>({ websites: [], subscriptions: [], domains: [], hosting: [], renewals: [] });

  const load = useCallback(async () => {
    const supabase = createClient();
    const [c, w, s, d, h, r] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("client_websites").select("*").eq("client_id", clientId).order("created_at"),
      supabase.from("client_subscriptions").select("*").eq("client_id", clientId).order("expiry_date"),
      supabase.from("client_domains").select("*").eq("client_id", clientId).order("expiry_date"),
      supabase.from("client_hosting").select("*").eq("client_id", clientId).order("expiry_date"),
      supabase.from("renewal_requests").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    ]);
    setClient((c.data as Client) ?? null);
    setData({ websites: w.data ?? [], subscriptions: s.data ?? [], domains: d.data ?? [], hosting: h.data ?? [], renewals: r.data ?? [] });
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle
        title={client ? `خدمات العميل: ${client.name}` : "خدمات العميل"}
        description="إدارة المواقع والاشتراكات والدومينات والاستضافة وطلبات التجديد."
        action={<button type="button" onClick={() => router.back()} className="btn-secondary px-4 py-2.5">رجوع</button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-xl px-4 py-2.5 text-sm font-semibold", tab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "renewals" ? (
        <RenewalsTab items={data.renewals as RenewalRequest[]} reload={load} />
      ) : (
        <CrudTab config={configs[tab]} clientId={clientId} items={data[tab] as Record<string, unknown>[]} reload={load} />
      )}
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const meta = statusMeta(status);
  return <Badge color={meta.tone as "green" | "amber" | "red" | "gray" | "brand"}>{meta.ar}</Badge>;
}

function CrudTab({ config, clientId, items, reload }: { config: EntityConfig; clientId: string; items: Record<string, unknown>[]; reload: () => void }) {
  const { push } = useToast();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null);

  function set(field: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = { ...editing };
    for (const f of config.fields) {
      if (f.type === "number") payload[f.key] = Number(payload[f.key]) || 0;
    }
    const { error } = editing.id
      ? await supabase.from(config.table).update(payload).eq("id", editing.id as string)
      : await supabase.from(config.table).insert({ ...payload, client_id: clientId });
    setSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم الحفظ");
    setEditing(null);
    reload();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await createClient().from(config.table).delete().eq("id", deleting.id as string);
    setDeleting(null);
    push("success", "تم الحذف");
    reload();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setEditing({ ...config.empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة {config.label}</button>
      </div>

      {items.length === 0 ? (
        <EmptyState title={`لا توجد ${config.label}ات`} action={<button type="button" onClick={() => setEditing({ ...config.empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                {config.columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-start font-semibold">{col.label}</th>
                ))}
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((row) => (
                <tr key={row.id as string} className="hover:bg-brand-50/40">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-600" dir={col.ltr ? "ltr" : undefined}>
                      {col.key === "status" ? <StatusLabel status={String(row[col.key] ?? "")} /> : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditing({ ...row })} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setDeleting(row)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `تعديل ${config.label}` : `إضافة ${config.label}`} size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.type === "select" ? (
                  <select className="input" value={String(editing[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)}>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="input"
                    dir={f.type === "text" ? undefined : "ltr"}
                    type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                    value={f.type === "number" ? Number(editing[f.key] ?? 0) : String(editing[f.key] ?? "")}
                    onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title={`حذف ${config.label}`} message={`هل أنت متأكد من الحذف؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}

function RenewalsTab({ items, reload }: { items: RenewalRequest[]; reload: () => void }) {
  const { push } = useToast();

  async function setStatus(id: string, status: string) {
    const { error } = await createClient().from("renewal_requests").update({ status }).eq("id", id);
    if (error) return push("error", error.message);
    push("success", "تم تحديث الحالة");
    reload();
  }

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState title="لا توجد طلبات تجديد" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">الخدمة</th>
                <th className="px-4 py-3 text-start font-semibold">القيمة</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-ink-900">{r.service_name ?? r.service_type}</td>
                  <td className="px-4 py-3 text-gray-500">{Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusLabel status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString("ar-JO")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {r.status !== "completed" && (
                        <button type="button" onClick={() => setStatus(r.id, "completed")} className="rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100">إكمال</button>
                      )}
                      {r.status === "new" && (
                        <button type="button" onClick={() => setStatus(r.id, "in_progress")} className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">بدء</button>
                      )}
                      {r.status !== "closed" && (
                        <button type="button" onClick={() => setStatus(r.id, "closed")} className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">إغلاق</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
