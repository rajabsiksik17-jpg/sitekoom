"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Copy, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle } from "@/components/admin/ui";
import type { DynamicForm } from "@/lib/types";

export function FormsManager() {
  const { push } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<DynamicForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<DynamicForm | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("dynamic_forms").select("*").order("sort");
    setItems((data ?? []) as DynamicForm[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(item: DynamicForm) {
    await createClient().from("dynamic_forms").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await createClient().from("dynamic_forms").delete().eq("id", deleting.id);
    setDeleting(null);
    if (error) return push("error", error.message);
    push("success", "تم حذف النموذج");
    load();
  }

  async function clone(item: DynamicForm) {
    setCloning(item.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("dynamic_forms").insert({
        key: `${item.key}-copy-${Date.now().toString(36).slice(-4)}`,
        title_ar: `${item.title_ar} - نسخة`, title_en: `${item.title_en} - Copy`,
        description_ar: item.description_ar, description_en: item.description_en,
        success_message_ar: item.success_message_ar, success_message_en: item.success_message_en,
        is_active: false,
      }).select().single();
      if (error) throw error;
      push("success", "تم استنساخ النموذج");
      router.push(`/admin/forms/${data.id}`);
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الاستنساخ");
    } finally {
      setCloning(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="النماذج" description="إدارة النماذج الديناميكية."
        action={<Link href="/admin/forms/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة نموذج</Link>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد نماذج" action={<Link href="/admin/forms/new" className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة نموذج</Link>} />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="card flex flex-wrap items-center gap-3 p-4">
              <Link href={`/admin/forms/${f.id}`} className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 hover:text-brand-700">{f.title_ar || f.key}</p>
                <p className="text-xs text-gray-400" dir="ltr">{f.key}</p>
              </Link>
              <button type="button" onClick={() => toggle(f)}><Badge color={f.is_active ? "green" : "gray"}>{f.is_active ? "مفعّل" : "معطّل"}</Badge></button>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => clone(f)} disabled={cloning === f.id} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50" aria-label="استنساخ">
                  {cloning === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                </button>
                <Link href={`/admin/forms/${f.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></Link>
                <button type="button" onClick={() => setDeleting(f)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف النموذج" message={`هل أنت متأكد من حذف "${deleting?.title_ar || deleting?.key}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
