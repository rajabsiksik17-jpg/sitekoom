"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { publishLabels } from "@/components/admin/nav";
import { slugify } from "@/lib/utils";
import { useBulkSelection, BulkActionsBar, type BulkActionDef } from "@/components/admin/bulk-actions-bar";
import { BulkScreenshotModal, type BulkShotProject } from "@/components/admin/bulk-screenshot-modal";
import type { Project, Service, ProjectCategory } from "@/lib/types";

const BULK_ACTIONS: BulkActionDef[] = [
  { key: "change_category", label: "تغيير التصنيف" },
  { key: "change_service", label: "تغيير الخدمة" },
  { key: "links", label: "إضافة/تحديد روابط المواقع" },
  { key: "delete", label: "حذف", danger: true },
];

export function ProjectsManager() {
  const { push } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  // Bulk state
  const [bulk, setBulk] = useState<{ action: "change_category" | "change_service" | "delete" } | null>(null);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkService, setBulkService] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const ids = items.map((i) => i.id);
  const sel = useBulkSelection(ids);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [p, c, s] = await Promise.all([
      supabase.from("projects").select("*, category:project_categories(*)").is("deleted_at", null).order("sort").order("created_at"),
      supabase.from("project_categories").select("*").order("name_ar"),
      supabase.from("services").select("id,title_ar,title_en,sort").is("deleted_at", null).order("sort"),
    ]);
    setItems((p.data ?? []) as Project[]);
    setCategories((c.data ?? []) as ProjectCategory[]);
    setServices((s.data ?? []) as Service[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublish(item: Project) {
    const supabase = createClient();
    const next = item.status_field === "published" ? "draft" : "published";
    const { error } = await supabase.from("projects").update({ status_field: next, published_at: next === "published" ? new Date().toISOString() : null }).eq("id", item.id);
    if (error) return push("error", error.message);
    push("success", "تم التحديث");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    if (error) return push("error", error.message);
    push("success", "تم حذف المشروع");
    load();
  }

  async function runBulk() {
    if (!bulk) return;
    setBulkBusy(true);
    try {
      const value = bulk.action === "change_category" ? bulkCategory : bulk.action === "change_service" ? bulkService : "";
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "projects", action: bulk.action, ids: Array.from(sel.selected), value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "فشل العملية");
      push("success", `تم تحديث ${data.updated} عمل بنجاح`);
      sel.clear();
      setBulk(null);
      setBulkCategory("");
      setBulkService("");
      load();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل العملية");
    } finally {
      setBulkBusy(false);
    }
  }

  async function clone(item: Project) {
    const supabase = createClient();
    setCloning(item.id);
    try {
      const newSlug = slugify(`${item.slug}-copy-${Date.now().toString(36).slice(-4)}`);
      const { data: copy, error } = await supabase
        .from("projects")
        .insert({
          title_ar: `${item.title_ar} - نسخة`,
          title_en: `${item.title_en} - Copy`,
          slug: newSlug,
          short_desc_ar: item.short_desc_ar,
          short_desc_en: item.short_desc_en,
          full_desc_ar: item.full_desc_ar,
          full_desc_en: item.full_desc_en,
          service_id: item.service_id,
          category_id: item.category_id,
          status: item.status,
          completion_date: item.completion_date,
          thumbnail: item.thumbnail,
          cover_image: item.cover_image,
          logo: item.logo,
          project_url: item.project_url,
          technologies: item.technologies ?? [],
          status_field: "draft",
          is_featured: false,
        })
        .select()
        .single();
      if (error) throw error;
      const newId = copy.id;

      const { data: imgs } = await supabase.from("project_images").select("*").eq("project_id", item.id).order("sort");
      if (imgs?.length) {
        await supabase.from("project_images").insert(imgs.map((i) => ({ project_id: newId, url: i.url, alt: i.alt, is_primary: i.is_primary, sort: i.sort })));
      }

      const { data: ppi } = await supabase.from("project_portfolio_items").select("*").eq("project_id", item.id).order("sort");
      if (ppi?.length) {
        await supabase.from("project_portfolio_items").insert(ppi.map((x) => ({
          project_id: newId, service_id: x.service_id, type: x.type,
          title_ar: x.title_ar, title_en: x.title_en, description_ar: x.description_ar, description_en: x.description_en,
          caption_ar: x.caption_ar, caption_en: x.caption_en, alt_ar: x.alt_ar, alt_en: x.alt_en,
          url: x.url, thumbnail: x.thumbnail, platform: x.platform, icon: x.icon,
          button_text_ar: x.button_text_ar, button_text_en: x.button_text_en,
          button_style: x.button_style, button_action: x.button_action, display_mode: x.display_mode,
          is_visible: x.is_visible, is_featured: x.is_featured, sort: x.sort, data: x.data ?? {},
        })));
      }

      const { data: feat } = await supabase.from("project_features").select("*").eq("project_id", item.id).order("sort");
      if (feat?.length) {
        await supabase.from("project_features").insert(feat.map((f) => ({
          project_id: newId, icon: f.icon, title_ar: f.title_ar, title_en: f.title_en,
          description_ar: f.description_ar, description_en: f.description_en, sort: f.sort,
        })));
      }

      const { data: seo } = await supabase.from("seo_metadata").select("*").eq("entity_type", "project").eq("entity_id", item.id);
      if (seo?.length) {
        await supabase.from("seo_metadata").insert(seo.map((s) => ({
          entity_type: "project", entity_id: newId, locale: s.locale,
          seo_title: s.seo_title, meta_description: s.meta_description, focus_keyword: s.focus_keyword,
          keywords: s.keywords, canonical_url: s.canonical_url, og_title: s.og_title,
          og_description: s.og_description, og_image: s.og_image, twitter_card: s.twitter_card,
          robots: s.robots, schema: s.schema ?? {},
        })));
      }

      push("success", "تم استنساخ العمل");
      router.push(`/admin/projects/${newId}`);
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
      <PageTitle title="الأعمال" description="إدارة مشاريع الشركة."
        action={<Link href="/admin/projects/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مشروع</Link>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد مشاريع" description="ابدأ بإضافة أول مشروع." action={<Link href="/admin/projects/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مشروع</Link>} />
      ) : (
        <>
          {sel.any && (
            <BulkActionsBar
              count={sel.count}
              singular="عمل"
              plural="أعمال"
              actions={BULK_ACTIONS}
              onAction={(key) => {
                if (key === "links") {
                  setScreenshotOpen(true);
                  return;
                }
                setBulk({ action: key as "change_category" | "change_service" | "delete" });
              }}
              onCancel={sel.clear}
              busy={bulkBusy}
            />
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-start text-gray-600">
                <tr>
                  <th className="w-12 px-3 py-3">
                    <input type="checkbox" className="rounded border-brand-200 text-brand-600" checked={sel.allSelected} onChange={sel.toggleAll} aria-label="تحديد الكل" />
                  </th>
                  <th className="px-2 py-3 text-start font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-start font-semibold">التصنيف</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {items.map((item) => {
                  const st = publishLabels[item.status_field] ?? { label: item.status_field, color: "gray" as const };
                  return (
                    <tr key={item.id} className="hover:bg-brand-50/40">
                      <td className="px-3 py-3">
                        <input type="checkbox" className="rounded border-brand-200 text-brand-600" checked={sel.selected.has(item.id)} onChange={() => sel.toggle(item.id)} aria-label={`تحديد ${item.title_ar}`} />
                      </td>
                      <td className="px-2 py-3 font-medium text-ink-900">{item.title_ar}</td>
                      <td className="px-4 py-3 text-gray-500">{item.category?.name_ar}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => togglePublish(item)}><Badge color={st.color}>{st.label}</Badge></button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => clone(item)} disabled={cloning === item.id} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50" aria-label="استنساخ">
                            {cloning === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <Link href={`/admin/projects/${item.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                          <button type="button" onClick={() => setDeleting(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog open={!!deleting} title="حذف المشروع" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />

      {/* Bulk: change category */}
      <Modal
        open={bulk?.action === "change_category"}
        onClose={() => setBulk(null)}
        title="تغيير التصنيف"
        size="sm"
        footer={<>
          <button type="button" onClick={() => setBulk(null)} className="btn-secondary px-4 py-2 text-sm">إلغاء</button>
          <button type="button" onClick={runBulk} disabled={bulkBusy || !bulkCategory} className="btn-primary px-6 py-2 text-sm">{bulkBusy ? "جارٍ التنفيذ..." : `تغيير ${sel.count} عمل`}</button>
        </>}
      >
        <Field label="التصنيف الجديد">
          <select className="input" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
            <option value="">اختر التصنيف</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
        </Field>
      </Modal>

      {/* Bulk: change service */}
      <Modal
        open={bulk?.action === "change_service"}
        onClose={() => setBulk(null)}
        title="تغيير الخدمة"
        size="sm"
        footer={<>
          <button type="button" onClick={() => setBulk(null)} className="btn-secondary px-4 py-2 text-sm">إلغاء</button>
          <button type="button" onClick={runBulk} disabled={bulkBusy || !bulkService} className="btn-primary px-6 py-2 text-sm">{bulkBusy ? "جارٍ التنفيذ..." : `تغيير ${sel.count} عمل`}</button>
        </>}
      >
        <Field label="الخدمة الجديدة" hint="تتغيّر صورة الأعمال للمشاريع ذات الشعار تلقائيًا حسب الخدمة الجديدة.">
          <select className="input" value={bulkService} onChange={(e) => setBulkService(e.target.value)}>
            <option value="">اختر الخدمة</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.title_ar}</option>)}
          </select>
        </Field>
      </Modal>

      {/* Bulk: delete */}
      <ConfirmDialog
        open={bulk?.action === "delete"}
        title="حذف الأعمال"
        message={`هل أنت متأكد من حذف ${sel.count} أعمال؟`}
        onCancel={() => setBulk(null)}
        onConfirm={runBulk}
        loading={bulkBusy}
      />

      {/* Bulk: website links + screenshots */}
      {screenshotOpen && (
        <BulkScreenshotModal
          projects={items.filter((i) => sel.selected.has(i.id)).map((i): BulkShotProject => ({ id: i.id, title: i.title_ar || i.title_en, url: i.project_url ?? "" }))}
          onClose={() => {
            setScreenshotOpen(false);
            sel.clear();
            load();
          }}
        />
      )}
    </div>
  );
}
