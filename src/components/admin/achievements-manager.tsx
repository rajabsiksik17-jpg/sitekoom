"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle } from "@/components/admin/ui";
import { publishLabels } from "@/components/admin/nav";
import { slugify } from "@/lib/utils";
import type { Achievement } from "@/lib/types";

export function AchievementsManager() {
  const { push } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("achievements").select("*").is("deleted_at", null).order("sort").order("created_at");
    setItems((data ?? []) as Achievement[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(item: Achievement) {
    const next = item.status_field === "published" ? "draft" : "published";
    await createClient().from("achievements").update({ status_field: next, published_at: next === "published" ? new Date().toISOString() : null }).eq("id", item.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await createClient().from("achievements").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    push("success", "تم حذف الإنجاز");
    load();
  }

  async function clone(item: Achievement) {
    setCloning(item.id);
    try {
      const slug = slugify(`${item.slug}-copy-${Date.now().toString(36).slice(-4)}`);
      const supabase = createClient();
      const { data, error } = await supabase.from("achievements").insert({
        title_ar: `${item.title_ar} - نسخة`, title_en: `${item.title_en} - Copy`, slug,
        main_image: item.main_image, short_desc_ar: item.short_desc_ar, short_desc_en: item.short_desc_en,
        full_desc_ar: item.full_desc_ar, full_desc_en: item.full_desc_en,
        type: item.type, category: item.category, date: item.date,
        website_url: item.website_url, project_url: item.project_url, external_url: item.external_url,
        iframe_url: item.iframe_url, demo_url: item.demo_url, display_website: item.display_website,
        video_url: item.video_url, challenge_ar: item.challenge_ar, challenge_en: item.challenge_en,
        solution_ar: item.solution_ar, solution_en: item.solution_en, results_ar: item.results_ar, results_en: item.results_en,
        service_ids: item.service_ids, technologies: item.technologies, status_field: "draft",
      }).select().single();
      if (error) throw error;
      push("success", "تم استنساخ الإنجاز");
      router.push(`/admin/achievements/${data.id}`);
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الاستنساخ");
    } finally {
      setCloning(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="الإنجازات" description="إدارة إنجازات ومشاريع الشركة."
        action={<Link href="/admin/achievements/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة إنجاز</Link>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد إنجازات" action={<Link href="/admin/achievements/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة إنجاز</Link>} />
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const st = publishLabels[a.status_field] ?? { label: a.status_field, color: "gray" as const };
            return (
              <div key={a.id} className="card flex flex-wrap items-center gap-3 p-4">
                <Link href={`/admin/achievements/${a.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 hover:text-brand-700">{a.title_ar}</p>
                  <p className="text-xs text-gray-500">{a.category} · {a.technologies?.slice(0, 3).join(", ")}</p>
                </Link>
                <button type="button" onClick={() => toggle(a)}><Badge color={st.color}>{st.label}</Badge></button>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => clone(a)} disabled={cloning === a.id} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50" aria-label="استنساخ">
                    {cloning === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <Link href={`/admin/achievements/${a.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                  <button type="button" onClick={() => setDeleting(a)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف الإنجاز" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
