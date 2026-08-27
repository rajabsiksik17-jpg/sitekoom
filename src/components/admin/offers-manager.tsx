"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import type { Offer } from "@/lib/types";

const statusMeta: Record<string, { label: string; color: "green" | "gray" | "amber" }> = {
  draft: { label: "مسودة", color: "gray" },
  published: { label: "منشور", color: "green" },
  hidden: { label: "مخفي", color: "amber" },
};

export function OffersManager() {
  const { push } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Offer | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("offers").select("*").is("deleted_at", null).order("sort").order("created_at");
    setItems((data ?? []) as Offer[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(item: Offer) {
    const next = item.status === "published" ? "draft" : "published";
    await createClient().from("offers").update({ status: next }).eq("id", item.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await createClient().from("offers").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    push("success", "تم حذف العرض");
    load();
  }

  async function clone(item: Offer) {
    setCloning(item.id);
    try {
      const slug = slugify(`${item.slug}-copy-${Date.now().toString(36).slice(-4)}`);
      const supabase = createClient();
      const { data, error } = await supabase.from("offers").insert({
        title_ar: `${item.title_ar} - نسخة`, title_en: `${item.title_en} - Copy`, slug,
        main_image: item.main_image, short_desc_ar: item.short_desc_ar, short_desc_en: item.short_desc_en,
        full_desc_ar: item.full_desc_ar, full_desc_en: item.full_desc_en,
        base_price: item.base_price, currency: item.currency, pricing_type: item.pricing_type,
        price_display: item.price_display, duration: item.duration, status: "draft",
        service_ids: item.service_ids, cta_text_ar: item.cta_text_ar, cta_text_en: item.cta_text_en,
        chat_text_ar: item.chat_text_ar, chat_text_en: item.chat_text_en,
      }).select().single();
      if (error) throw error;
      push("success", "تم استنساخ العرض");
      router.push(`/admin/offers/${data.id}`);
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الاستنساخ");
    } finally {
      setCloning(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="العروض" description="إدارة عروض الأسعار والتسعير الديناميكي."
        action={<Link href="/admin/offers/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عرض</Link>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد عروض" action={<Link href="/admin/offers/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عرض</Link>} />
      ) : (
        <div className="space-y-3">
          {items.map((o) => {
            const st = statusMeta[o.status] ?? { label: o.status, color: "gray" as const };
            return (
              <div key={o.id} className="card flex flex-wrap items-center gap-3 p-4">
                <Link href={`/admin/offers/${o.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 hover:text-brand-700">{o.title_ar}</p>
                  <p className="text-xs text-gray-500">
                    {o.price_display === "request_quote" ? "اطلب عرض سعر" : `${o.base_price} ${o.currency}`} · {o.pricing_type}
                  </p>
                </Link>
                <button type="button" onClick={() => toggle(o)}><Badge color={st.color}>{st.label}</Badge></button>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => clone(o)} disabled={cloning === o.id} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50" aria-label="استنساخ">
                    {cloning === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <Link href={`/admin/offers/${o.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                  <button type="button" onClick={() => setDeleting(o)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف العرض" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
