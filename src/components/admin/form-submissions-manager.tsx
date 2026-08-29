"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, Modal, ConfirmDialog } from "@/components/admin/ui";
import { cn, formatDateTime } from "@/lib/utils";
import { Mail, Eye, X } from "lucide-react";
import { EmailComposer } from "@/components/admin/email-composer";
import type { FormSubmission, FormSubmissionValue } from "@/lib/types";

type SubmissionRow = FormSubmission & { offer?: { title_ar: string; title_en: string; slug: string } | null };

const STATUS = ["new", "replied", "rejected"] as const;
const statusMeta: Record<string, { label: string; color: "brand" | "green" | "red" }> = {
  new: { label: "جديد", color: "brand" },
  replied: { label: "تم الرد", color: "green" },
  rejected: { label: "مرفوض", color: "red" },
};

function effectiveStatus(s: string): string {
  if (s === "new") return "new";
  if (s === "rejected") return "rejected";
  return "replied"; // contacted / quoted / approved / completed → handled
}

export function FormSubmissionsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("new");

  const [detail, setDetail] = useState<SubmissionRow | null>(null);
  const [values, setValues] = useState<FormSubmissionValue[]>([]);
  const [emailTarget, setEmailTarget] = useState<SubmissionRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SubmissionRow | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("form_submissions").select("*, offer:offers(title_ar,title_en,slug)").order("created_at", { ascending: false });
    setItems((data ?? []) as SubmissionRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDetails(item: SubmissionRow) {
    setDetail(item);
    const supabase = createClient();
    const { data } = await supabase.from("form_submission_values").select("*").eq("submission_id", item.id).order("sort");
    setValues((data ?? []) as FormSubmissionValue[]);
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    await createClient().from("form_submissions").update({ status: "rejected" }).eq("id", rejectTarget.id);
    setRejecting(false);
    setRejectTarget(null);
    push("success", "تم رفض الطلب");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const list = items.filter((i) => i.offer_id && effectiveStatus(i.status) === filter);

  return (
    <div>
      <PageTitle title="طلبات العروض" description="طلبات عروض الأسعار المرسلة من العملاء." />

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS.map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={cn("rounded-lg px-4 py-2 text-sm font-semibold", filter === s ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {statusMeta[s].label} ({items.filter((i) => i.offer_id && effectiveStatus(i.status) === s).length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="لا توجد طلبات" description="لا توجد طلبات في هذه القائمة." />
      ) : (
        <div className="space-y-3">
          {list.map((s) => (
            <div key={s.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink-900">{s.customer_name ?? "زائر"}</p>
                  <Badge color={statusMeta[effectiveStatus(s.status)].color}>{statusMeta[effectiveStatus(s.status)].label}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-gray-500" dir="ltr">{s.customer_email} {s.customer_phone}</p>
                {s.offer && <p className="mt-0.5 text-sm font-semibold text-brand-700">{s.offer.title_ar}</p>}
                <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(s.created_at, "ar")}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {s.customer_email && (
                  <button type="button" onClick={() => setEmailTarget(s)} className="btn-primary px-3 py-2 text-sm">
                    <Mail className="h-4 w-4" /> إرسال إيميل
                  </button>
                )}
                <button type="button" onClick={() => openDetails(s)} className="btn-secondary px-3 py-2 text-sm">
                  <Eye className="h-4 w-4" /> تفاصيل
                </button>
                {effectiveStatus(s.status) !== "rejected" && (
                  <button type="button" onClick={() => setRejectTarget(s)} className="btn-danger px-3 py-2 text-sm">
                    <X className="h-4 w-4" /> رفض
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="تفاصيل الطلب" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><span className="text-gray-500">الاسم:</span> <b>{detail.customer_name ?? "—"}</b></div>
              <div><span className="text-gray-500">البريد:</span> <b dir="ltr">{detail.customer_email ?? "—"}</b></div>
              <div><span className="text-gray-500">الهاتف:</span> <b dir="ltr">{detail.customer_phone ?? "—"}</b></div>
              <div><span className="text-gray-500">العرض:</span> <b>{detail.offer?.title_ar ?? "—"}</b></div>
              <div className="sm:col-span-2"><span className="text-gray-500">الموضوع:</span> <b>{detail.subject ?? "—"}</b></div>
              <div><span className="text-gray-500">الحالة:</span> <Badge color={statusMeta[effectiveStatus(detail.status)].color}>{statusMeta[effectiveStatus(detail.status)].label}</Badge></div>
              <div><span className="text-gray-500">تاريخ التقديم:</span> <b>{formatDateTime(detail.created_at, "ar")}</b></div>
              {detail.replied_at && <div><span className="text-gray-500">تاريخ الإرسال:</span> <b>{formatDateTime(detail.replied_at, "ar")}</b></div>}
            </div>

            <div className="rounded-xl border border-brand-100 p-4">
              <p className="mb-2 text-sm font-bold text-ink-900">التسعير</p>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-gray-500">السعر الأساسي:</span> <b>{detail.base_price ?? "—"} {detail.currency}</b></div>
                <div><span className="text-gray-500">السعر المحسوب:</span> <b>{detail.calculated_total ?? "—"} {detail.currency}</b></div>
                <div><span className="text-gray-500">السعر النهائي:</span> <b>{detail.final_admin_price ?? detail.calculated_total ?? "—"} {detail.currency}</b></div>
              </div>

              {((detail.selected_options as unknown[] | undefined) ?? []).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500">الخيارات المختارة:</p>
                  {(detail.selected_options as { label_ar?: string; label_en?: string; price?: number; included?: boolean }[]).map((o, i) => (
                    <div key={i} className="text-sm">• {o.label_ar || o.label_en} {o.included ? <span className="text-gray-400">(مشمول)</span> : Number(o.price) > 0 ? <span className="text-gray-400">({o.price})</span> : null}</div>
                  ))}
                </div>
              )}

              {((detail.selected_addons as unknown[] | undefined) ?? []).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500">الإضافات:</p>
                  {(detail.selected_addons as { title_ar?: string; title_en?: string; price?: number; included?: boolean }[]).map((a, i) => (
                    <div key={i} className="text-sm">• {a.title_ar || a.title_en} {a.included ? <span className="text-gray-400">(مشمول)</span> : Number(a.price) > 0 ? <span className="text-gray-400">({a.price})</span> : <span className="text-gray-400">(مجانًا)</span>}</div>
                  ))}
                </div>
              )}

              {detail.price_note && <p className="mt-2 text-xs text-amber-600">ملاحظة: {detail.price_note}</p>}
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-ink-900">إجابات النموذج</p>
              {values.length === 0 ? (
                <p className="text-sm text-gray-400">لا توجد إجابات.</p>
              ) : (
                <div className="space-y-2">
                  {values.map((v) => (
                    <div key={v.id} className="flex flex-wrap gap-2 border-b border-brand-50 pb-2 text-sm">
                      <span className="w-40 shrink-0 font-semibold text-gray-600">{v.field_label || v.field_key}</span>
                      <span className="min-w-0 flex-1 break-words">{v.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {emailTarget && (
        <EmailComposer
          open={!!emailTarget}
          onClose={() => setEmailTarget(null)}
          recipientEmail={emailTarget.customer_email ?? ""}
          recipientName={emailTarget.customer_name ?? undefined}
          defaultSubject={emailTarget.offer ? `بخصوص عرض: ${emailTarget.offer.title_ar}` : "بخصوص طلبك"}
          entityType="offer_request"
          entityId={emailTarget.id}
          locale={(emailTarget.language as "ar" | "en") || "ar"}
          onSent={load}
        />
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        title="رفض الطلب"
        message="هل أنت متأكد من رفض هذا الطلب؟"
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
        loading={rejecting}
      />
    </div>
  );
}
