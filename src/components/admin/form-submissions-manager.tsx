"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type { FormSubmission, FormSubmissionValue } from "@/lib/types";

const STATUS = ["new", "contacted", "in_progress", "quoted", "approved", "rejected", "completed", "archived"];

type SubmissionRow = FormSubmission & { offer?: { title_ar: string; title_en: string; slug: string } | null };
const statusMeta: Record<string, { label: string; color: "brand" | "green" | "red" | "amber" | "gray" }> = {
  new: { label: "جديد", color: "brand" },
  contacted: { label: "تم التواصل", color: "amber" },
  in_progress: { label: "قيد التنفيذ", color: "amber" },
  quoted: { label: "تم التسعير", color: "brand" },
  approved: { label: "مقبول", color: "green" },
  rejected: { label: "مرفوض", color: "red" },
  completed: { label: "مكتمل", color: "green" },
  archived: { label: "مؤرشف", color: "gray" },
};

export function FormSubmissionsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<SubmissionRow[]>([]);
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [values, setValues] = useState<FormSubmissionValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [customPrice, setCustomPrice] = useState("");
  const [priceNote, setPriceNote] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("form_submissions").select("*, offer:offers(title_ar,title_en,slug)").order("created_at", { ascending: false });
    setItems((data ?? []) as SubmissionRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function open(item: SubmissionRow) {
    setSelected(item);
    setCustomPrice(item.custom_admin_price != null ? String(item.custom_admin_price) : "");
    setPriceNote(item.price_note ?? "");
    const supabase = createClient();
    const { data } = await supabase.from("form_submission_values").select("*").eq("submission_id", item.id).order("sort");
    setValues((data ?? []) as FormSubmissionValue[]);
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    await createClient().from("form_submissions").update({ status }).eq("id", selected.id);
    setSelected({ ...selected, status });
    load();
  }

  async function savePrice() {
    if (!selected) return;
    const price = customPrice.trim() === "" ? null : Number(customPrice);
    await createClient().from("form_submissions").update({ custom_admin_price: price, final_admin_price: price, price_note: priceNote }).eq("id", selected.id);
    setSelected({ ...selected, custom_admin_price: price, final_admin_price: price, price_note: priceNote });
    push("success", "تم حفظ السعر المخصص");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const list = (filter === "all" ? items : items.filter((i) => i.status === filter)).filter((i) => i.offer_id);

  return (
    <div>
      <PageTitle title="طلبات العروض" description="طلبات عروض الأسعار المرسلة من العملاء." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter("all")} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", filter === "all" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>الكل ({items.length})</button>
        {STATUS.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", filter === s ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {statusMeta[s]?.label ?? s} ({items.filter((i) => i.status === s).length})
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {list.length === 0 ? <EmptyState title="لا توجد طلبات" /> : list.map((s) => (
            <button key={s.id} type="button" onClick={() => open(s)} className={cn("card block w-full p-4 text-start", selected?.id === s.id ? "border-brand-400 ring-2 ring-brand-200" : "")}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{s.customer_name ?? "زائر"}</p>
                <Badge color={statusMeta[s.status]?.color ?? "gray"}>{statusMeta[s.status]?.label ?? s.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600" dir="ltr">{s.customer_phone} {s.customer_email}</p>
              {s.subject && <p className="mt-1 text-sm font-medium text-ink-900">{s.subject}</p>}
              <p className="mt-1 text-sm text-brand-700">{s.offer?.title_ar}</p>
              <div className="mt-1 flex items-center justify-between text-sm">
                {s.calculated_total != null && <span className="font-bold text-ink-900">{s.calculated_total} {s.currency}</span>}
                <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString("ar")}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? <EmptyState title="اختر طلبًا" /> : (
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-ink-900">{selected.customer_name ?? "زائر"}</h3>
                  <p className="text-xs text-gray-500" dir="ltr">{selected.customer_email} {selected.customer_phone}</p>
                  {selected.offer_id && <p className="mt-1 text-sm font-semibold text-brand-700">العرض: {selected.offer?.title_ar}</p>}
                </div>
                <select className="input w-40" value={selected.status} onChange={(e) => changeStatus(e.target.value)}>
                  {STATUS.map((s) => <option key={s} value={s}>{statusMeta[s]?.label ?? s}</option>)}
                </select>
              </div>

              <div className="rounded-xl border border-brand-100 p-4">
                <p className="mb-2 text-sm font-bold text-ink-900">السعر</p>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <div><span className="text-gray-500">الأساسي:</span> <b>{selected.base_price} {selected.currency}</b></div>
                  <div><span className="text-gray-500">المحسوب:</span> <b>{selected.calculated_total} {selected.currency}</b></div>
                  <div><span className="text-gray-500">المخصص:</span> <b>{selected.custom_admin_price ?? "—"} {selected.currency}</b></div>
                </div>
                {(selected.selected_options as unknown[] ?? []).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-500">الخيارات المختارة:</p>
                    {(selected.selected_options as { label_ar?: string; price?: number }[]).map((o, i) => (
                      <div key={i} className="text-sm">• {o.label_ar} <span className="text-gray-400">{Number(o.price) > 0 ? `${o.price}` : ""}</span></div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <input className="input" dir="ltr" type="number" placeholder="سعر مخصص" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} />
                  <input className="input flex-1" placeholder="ملاحظة / سبب التعديل" value={priceNote} onChange={(e) => setPriceNote(e.target.value)} />
                  <button type="button" onClick={savePrice} className="btn-primary px-4 py-2 text-sm">حفظ</button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-ink-900">إجابات النموذج</p>
                {values.length === 0 ? <p className="text-sm text-gray-400">لا توجد إجابات.</p> : (
                  <div className="space-y-2">
                    {values.map((v) => (
                      <div key={v.id} className="flex gap-3 border-b border-brand-50 pb-2 text-sm">
                        <span className="w-40 shrink-0 font-semibold text-gray-600">{v.field_label || v.field_key}</span>
                        <span className="flex-1">{v.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
