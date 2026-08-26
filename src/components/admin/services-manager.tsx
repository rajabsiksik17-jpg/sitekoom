"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle } from "@/components/admin/ui";
import { publishLabels } from "@/components/admin/nav";
import { slugify } from "@/lib/utils";
import type { Service } from "@/lib/types";

export function ServicesManager() {
  const { push } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort")
      .order("created_at");
    setItems((data ?? []) as Service[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublish(item: Service) {
    const supabase = createClient();
    const next = item.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("services")
      .update({ status: next, published_at: next === "published" ? new Date().toISOString() : null })
      .eq("id", item.id);
    if (error) return push("error", error.message);
    push("success", next === "published" ? "تم نشر الخدمة" : "تم تحويلها لمسودة");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from("services").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    if (error) return push("error", error.message);
    push("success", "تم حذف الخدمة");
    load();
  }

  async function move(item: Service, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const target = items[idx + dir];
    if (!target) return;
    const supabase = createClient();
    await supabase.from("services").update({ sort: target.sort }).eq("id", item.id);
    await supabase.from("services").update({ sort: item.sort }).eq("id", target.id);
    load();
  }

  async function clone(item: Service) {
    const supabase = createClient();
    setCloning(item.id);
    try {
      const newSlug = slugify(`${item.slug}-copy-${Date.now().toString(36).slice(-4)}`);
      const { data: copy, error } = await supabase
        .from("services")
        .insert({
          title_ar: `${item.title_ar} - نسخة`,
          title_en: `${item.title_en} - Copy`,
          slug: newSlug,
          icon: item.icon,
          short_desc_ar: item.short_desc_ar,
          short_desc_en: item.short_desc_en,
          full_desc_ar: item.full_desc_ar,
          full_desc_en: item.full_desc_en,
          main_image: item.main_image,
          category_id: item.category_id,
          portfolio_config: item.portfolio_config ?? [],
          status: "draft",
          is_featured: false,
        })
        .select()
        .single();
      if (error) throw error;
      const newId = copy.id;

      const { data: imgs } = await supabase.from("service_images").select("*").eq("service_id", item.id).order("sort");
      if (imgs?.length) {
        await supabase.from("service_images").insert(imgs.map((i) => ({ service_id: newId, url: i.url, alt: i.alt, is_primary: i.is_primary, sort: i.sort })));
      }
      const { data: feat } = await supabase.from("service_features").select("*").eq("service_id", item.id).order("sort");
      if (feat?.length) {
        await supabase.from("service_features").insert(feat.map((f) => ({
          service_id: newId, kind: f.kind, icon: f.icon, title_ar: f.title_ar, title_en: f.title_en,
          description_ar: f.description_ar, description_en: f.description_en, sort: f.sort,
        })));
      }
      const { data: faqs } = await supabase.from("service_faqs").select("*").eq("service_id", item.id).order("sort");
      if (faqs?.length) {
        await supabase.from("service_faqs").insert(faqs.map((f) => ({ service_id: newId, question_ar: f.question_ar, question_en: f.question_en, answer_ar: f.answer_ar, answer_en: f.answer_en, sort: f.sort })));
      }
      const { data: seo } = await supabase.from("seo_metadata").select("*").eq("entity_type", "service").eq("entity_id", item.id);
      if (seo?.length) {
        await supabase.from("seo_metadata").insert(seo.map((s) => ({
          entity_type: "service", entity_id: newId, locale: s.locale,
          seo_title: s.seo_title, meta_description: s.meta_description, focus_keyword: s.focus_keyword,
          keywords: s.keywords, canonical_url: s.canonical_url, og_title: s.og_title,
          og_description: s.og_description, og_image: s.og_image, twitter_card: s.twitter_card,
          robots: s.robots, schema: s.schema ?? {},
        })));
      }

      push("success", "تم استنساخ الخدمة");
      router.push(`/admin/services/${newId}`);
      router.refresh();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الاستنساخ");
    } finally {
      setCloning(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle
        title="الخدمات"
        description="إدارة خدمات الشركة."
        action={
          <Link href="/admin/services/new" className="btn-primary px-4 py-2.5">
            <Plus className="h-4 w-4" /> إضافة خدمة
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="لا توجد خدمات"
          description="ابدأ بإضافة أول خدمة."
          action={
            <Link href="/admin/services/new" className="btn-primary px-4 py-2.5">
              <Plus className="h-4 w-4" /> إضافة خدمة
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const st = publishLabels[item.status] ?? { label: item.status, color: "gray" as const };
            return (
              <div key={item.id} className="card flex flex-wrap items-center gap-3 p-4">
                <Link href={`/admin/services/${item.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 hover:text-brand-700">{item.title_ar}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{item.slug}</p>
                </Link>

                <button type="button" onClick={() => togglePublish(item)}>
                  <Badge color={st.color}>{st.label}</Badge>
                </button>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => clone(item)} disabled={cloning === item.id} className="rounded-lg p-2 text-gray-500 hover:bg-brand-100" aria-label="استنساخ">
                    {cloning === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => move(item, -1)} className="rounded-lg p-2 text-gray-500 hover:bg-brand-100" aria-label="أعلى"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(item, 1)} className="rounded-lg p-2 text-gray-500 hover:bg-brand-100" aria-label="أسفل"><ChevronDown className="h-4 w-4" /></button>
                  <Link href={`/admin/services/${item.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" aria-label="تعديل"><Pencil className="h-4 w-4" /></Link>
                  <button type="button" onClick={() => setDeleting(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="حذف الخدمة"
        message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
