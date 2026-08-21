"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle } from "@/components/admin/ui";
import { publishLabels } from "@/components/admin/nav";
import type { Project } from "@/lib/types";

export function ProjectsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("projects").select("*, category:project_categories(*)").is("deleted_at", null).order("sort").order("created_at");
    setItems((data ?? []) as Project[]);
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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="الأعمال" description="إدارة مشاريع الشركة."
        action={<Link href="/admin/projects/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مشروع</Link>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد مشاريع" description="ابدأ بإضافة أول مشروع." action={<Link href="/admin/projects/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مشروع</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العنوان</th>
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
                    <td className="px-4 py-3 font-medium text-ink-900">{item.title_ar}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category?.name_ar}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => togglePublish(item)}><Badge color={st.color}>{st.label}</Badge></button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
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
      )}

      <ConfirmDialog open={!!deleting} title="حذف المشروع" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
