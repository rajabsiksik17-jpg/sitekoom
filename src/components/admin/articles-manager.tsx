"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle } from "@/components/admin/ui";
import { publishLabels } from "@/components/admin/nav";
import { formatDateTime, slugify } from "@/lib/utils";
import type { Article } from "@/lib/types";

export function ArticlesManager() {
  const { push } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Article | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("articles").select("*, category:article_categories(*)").is("deleted_at", null).order("created_at", { ascending: false });
    setItems((data ?? []) as Article[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublish(item: Article) {
    const supabase = createClient();
    const next = item.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("articles").update({ status: next, published_at: next === "published" ? new Date().toISOString() : null }).eq("id", item.id);
    if (error) return push("error", error.message);
    push("success", "تم التحديث");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from("articles").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    if (error) return push("error", error.message);
    push("success", "تم حذف المقال");
    load();
  }

  async function clone(item: Article) {
    const supabase = createClient();
    setCloning(item.id);
    try {
      const newSlug = slugify(`${item.slug}-copy-${Date.now().toString(36).slice(-4)}`);
      const { data: copy, error } = await supabase
        .from("articles")
        .insert({
          title_ar: `${item.title_ar} - نسخة`,
          title_en: `${item.title_en} - Copy`,
          slug: newSlug,
          excerpt_ar: item.excerpt_ar,
          excerpt_en: item.excerpt_en,
          content_ar: item.content_ar,
          content_en: item.content_en,
          cover_image: item.cover_image,
          category_id: item.category_id,
          status: "draft",
          is_featured: false,
          scheduled_for: item.scheduled_for,
          related_service_ids: item.related_service_ids ?? [],
          related_project_ids: item.related_project_ids ?? [],
          related_article_ids: item.related_article_ids ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      const newId = copy.id;

      const { data: rels } = await supabase.from("article_tag_relations").select("*").eq("article_id", item.id);
      if (rels?.length) {
        await supabase.from("article_tag_relations").insert(rels.map((r) => ({ article_id: newId, tag_id: r.tag_id })));
      }

      const { data: seo } = await supabase.from("seo_metadata").select("*").eq("entity_type", "article").eq("entity_id", item.id);
      if (seo?.length) {
        await supabase.from("seo_metadata").insert(seo.map((s) => ({
          entity_type: "article", entity_id: newId, locale: s.locale,
          seo_title: s.seo_title, meta_description: s.meta_description, focus_keyword: s.focus_keyword,
          keywords: s.keywords, canonical_url: s.canonical_url, og_title: s.og_title,
          og_description: s.og_description, og_image: s.og_image, twitter_card: s.twitter_card,
          robots: s.robots, schema: s.schema ?? {},
        })));
      }

      push("success", "تم استنساخ المقال");
      router.push(`/admin/articles/${newId}`);
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
      <PageTitle title="المقالات" description="إدارة الأخبار والمقالات."
        action={<Link href="/admin/articles/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مقال</Link>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد مقالات" description="ابدأ بكتابة أول مقال." action={<Link href="/admin/articles/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مقال</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العنوان</th>
                <th className="px-4 py-3 text-start font-semibold">التصنيف</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((item) => {
                const st = publishLabels[item.status] ?? { label: item.status, color: "gray" as const };
                return (
                  <tr key={item.id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-ink-900">{item.title_ar}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category?.name_ar}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => togglePublish(item)}><Badge color={st.color}>{st.label}</Badge></button></td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(item.created_at, "ar")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => clone(item)} disabled={cloning === item.id} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50" aria-label="استنساخ">
                          {cloning === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <Link href={`/admin/articles/${item.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                        <button type="button" onClick={() => setDeleting(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف المقال" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
