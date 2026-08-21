"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog } from "@/components/admin/ui";
import type { Page } from "@/lib/types";

export function PagesManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Page | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("pages").select("*").order("sort").order("created_at");
    setItems((data ?? []) as Page[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublish(item: Page) {
    const supabase = createClient();
    const next = item.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("pages").update({ status: next }).eq("id", item.id);
    if (error) return push("error", error.message);
    push("success", next === "published" ? "تم نشر الصفحة" : "تم تحويلها لمسودة");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from("pages").delete().eq("id", deleting.id);
    setDeleting(null);
    if (error) return push("error", error.message);
    push("success", "تم حذف الصفحة");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle
        title="الصفحات"
        description="إدارة الصفحات الثابتة والديناميكية."
        action={<Link href="/admin/pages/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة صفحة</Link>}
      />

      {items.length === 0 ? (
        <EmptyState title="لا توجد صفحات" action={<Link href="/admin/pages/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة صفحة</Link>} />
      ) : (
        <div className="card divide-y divide-brand-50">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{p.title_ar}</p>
                <p className="text-xs text-gray-400" dir="ltr">/{p.slug}</p>
              </div>
              {p.is_system && <Badge color="brand">صفحة نظامية</Badge>}
              <button type="button" onClick={() => togglePublish(p)}>
                <Badge color={p.status === "published" ? "green" : "gray"}>{p.status === "published" ? "منشورة" : "مسودة"}</Badge>
              </button>
              <Link href={`/admin/pages/${p.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
              {!p.is_system && (
                <button type="button" onClick={() => setDeleting(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="حذف الصفحة"
        message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
