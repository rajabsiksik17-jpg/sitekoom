"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ImagePlus, Check } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function BulkLogoModal({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const { push } = useToast();
  const [logos, setLogos] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(projects.map((p) => [p.id, p.logo])),
  );
  const [checked, setChecked] = useState<Set<string>>(() => new Set(projects.map((p) => p.id)));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"all" | string>("all");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const selectedIds = useMemo(() => projects.filter((p) => checked.has(p.id)).map((p) => p.id), [projects, checked]);

  async function applyLogo(url: string) {
    setPickerOpen(false);
    const ids = pickerTarget === "all" ? selectedIds : [pickerTarget];
    if (!ids.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "projects", action: "change_logo", ids, value: url }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "فشل العملية");
      setLogos((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = url;
        return next;
      });
      push("success", `تم تعيين الشعار لـ ${ids.length} عمل`);
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل العملية");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-ink-900">وضع شعار للأعمال</h3>
            <p className="text-xs text-gray-500">اختر شعارًا لكل عمل من مكتبة الوسائط، أو طبّق شعارًا واحدًا على الجميع.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-brand-50" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 bg-brand-50/40 px-6 py-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <input type="checkbox" className="rounded border-brand-200 text-brand-600" checked={checked.size === projects.length && projects.length > 0} onChange={() => setChecked((prev) => (prev.size === projects.length ? new Set() : new Set(projects.map((p) => p.id))))} />
            تحديد الكل
          </label>
          <span className="text-xs text-gray-500">تم تحديد {selectedIds.length} عمل</span>
          <button
            type="button"
            disabled={busy || selectedIds.length === 0}
            onClick={() => { setPickerTarget("all"); setPickerOpen(true); }}
            className="btn-primary ms-auto px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <ImagePlus className="h-3.5 w-3.5" /> اختيار شعار للجميع
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {projects.map((p) => {
            const logo = logos[p.id];
            return (
              <div key={p.id} className={cn("flex items-center gap-3 rounded-xl border p-3", checked.has(p.id) ? "border-brand-200" : "border-brand-100")}>
                <input type="checkbox" className="rounded border-brand-200 text-brand-600" checked={checked.has(p.id)} onChange={() => setChecked((prev) => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} />
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-100 bg-brand-50">
                  {logo
                    ? // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" className="h-full w-full object-cover" />
                    : <span className="text-[10px] text-gray-400">لا شعار</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{p.title_ar || p.title_en}</p>
                  <p className="text-xs text-gray-400">{logo ? "لديه شعار" : "لا يوجد شعار"}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setPickerTarget(p.id); setPickerOpen(true); }}
                  className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-50"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> تغيير
                </button>
                {logo && (
                  <button type="button" onClick={() => { setPickerTarget(p.id); setPickerOpen(true); }} className="text-xs text-brand-600 hover:underline">استبدال</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        accept="image"
        onSelect={applyLogo}
      />
    </div>
  );
}
