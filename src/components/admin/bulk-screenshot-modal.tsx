"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Camera, Loader2, Check, AlertTriangle, LinkIcon } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { cn } from "@/lib/utils";

export type BulkShotProject = { id: string; title: string; url: string };

type RowState = {
  url: string;
  status: "idle" | "capturing" | "success" | "error" | "no_url";
  error?: string;
};

export function BulkScreenshotModal({
  projects,
  onClose,
}: {
  projects: BulkShotProject[];
  onClose: () => void;
}) {
  const { push } = useToast();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(projects.map((p) => [p.id, { url: p.url ?? "", status: "idle" }])),
  );
  const [checked, setChecked] = useState<Set<string>>(() => new Set(projects.map((p) => p.id)));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function requestClose() {
    if (running) setConfirmClose(true);
    else onClose();
  }

  function setUrl(id: string, url: string) {
    setRows((r) => ({ ...r, [id]: { ...r[id], url } }));
  }
  function setStatus(id: string, status: RowState["status"], error?: string) {
    setRows((r) => ({ ...r, [id]: { ...r[id], status, error } }));
  }

  const selectedIds = useMemo(() => projects.filter((p) => checked.has(p.id)).map((p) => p.id), [projects, checked]);

  function toggleAll() {
    setChecked((prev) => (prev.size === projects.length ? new Set() : new Set(projects.map((p) => p.id))));
  }

  async function capture(ids: string[], mode: "desktop" | "desktop_mobile") {
    if (running) return;
    setRunning(true);
    setTotal(ids.length);
    setProgress(0);
    let done = 0;

    // Process in small batches for controlled concurrency + live progress.
    for (let i = 0; i < ids.length; i += 2) {
      const batch = ids.slice(i, i + 2);
      const items = [];
      for (const id of batch) {
        const row = rows[id];
        const url = row.url.trim();
        if (!url) {
          setStatus(id, "no_url");
          done++;
          setProgress(done);
          continue;
        }
        setStatus(id, "capturing");
        items.push({ project_id: id, url, mode });
      }
      if (items.length) {
        try {
          const res = await fetch("/api/admin/bulk-screenshots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "فشل العملية");
          for (const r of (data.results ?? []) as { project_id: string; status: string; error?: string }[]) {
            if (r.status === "success") setStatus(r.project_id, "success");
            else if (r.status === "no_url") setStatus(r.project_id, "no_url");
            else setStatus(r.project_id, "error", r.error);
          }
        } catch (e) {
          for (const item of items) setStatus(item.project_id, "error", e instanceof Error ? e.message : "فشل الالتقاط");
        }
      }
      done += batch.length;
      setProgress(done);
    }
    setRunning(false);
    push("success", "اكتملت العملية");
  }

  const counts = useMemo(() => {
    let success = 0, error = 0, noUrl = 0;
    for (const id of selectedIds) {
      const s = rows[id]?.status;
      if (s === "success") success++;
      else if (s === "error") error++;
      else if (s === "no_url") noUrl++;
    }
    return { success, error, noUrl };
  }, [rows, selectedIds]);

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-card sm:max-w-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-ink-900">إضافة/تحديد روابط المواقع</h3>
            <p className="text-xs text-gray-500">أدخل رابط كل عمل ثم التقط Screenshot (Desktop أو Desktop + Mobile).</p>
          </div>
          <button type="button" onClick={requestClose} className="rounded-lg p-1 text-gray-400 hover:bg-brand-50" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 bg-brand-50/40 px-6 py-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <input type="checkbox" className="rounded border-brand-200 text-brand-600" checked={checked.size === projects.length && projects.length > 0} onChange={toggleAll} />
            تحديد الكل
          </label>
          <span className="text-xs text-gray-500">تم تحديد {selectedIds.length} عمل</span>
          <div className="ms-auto flex flex-wrap gap-2">
            <button type="button" disabled={running || selectedIds.length === 0} onClick={() => capture(selectedIds, "desktop")} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50">
              <Camera className="h-3.5 w-3.5" /> التقاط Desktop للجميع
            </button>
            <button type="button" disabled={running || selectedIds.length === 0} onClick={() => capture(selectedIds, "desktop_mobile")} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
              <Camera className="h-3.5 w-3.5" /> التقاط Desktop + Mobile للجميع
            </button>
          </div>
        </div>

        {/* Progress */}
        {running && (
          <div className="border-b border-brand-100 bg-brand-50/50 px-6 py-2 text-sm font-semibold text-brand-700">
            <Loader2 className="me-2 inline h-4 w-4 animate-spin" />
            جاري معالجة {progress} من {total}
          </div>
        )}

        {/* Rows */}
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {projects.map((p) => {
            const row = rows[p.id];
            return (
              <div key={p.id} className={cn("rounded-xl border p-3", checked.has(p.id) ? "border-brand-200" : "border-brand-100")}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-brand-200 text-brand-600" checked={checked.has(p.id)} onChange={() => setChecked((prev) => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} />
                  <p className="min-w-0 flex-1 truncate font-semibold text-ink-900">{p.title}</p>
                  {row.status === "capturing" && <span className="text-xs text-brand-600"><Loader2 className="me-1 inline h-3 w-3 animate-spin" />جاري الالتقاط...</span>}
                  {row.status === "success" && <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="h-3.5 w-3.5" />تم بنجاح</span>}
                  {row.status === "error" && <span className="inline-flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3.5 w-3.5" />فشل الالتقاط</span>}
                  {row.status === "no_url" && <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />لم يتم إدخال رابط</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <LinkIcon className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input className="input py-2 ps-8 text-sm" dir="ltr" placeholder="https://example.com" value={row.url} disabled={running} onChange={(e) => setUrl(p.id, e.target.value)} />
                  </div>
                  <button type="button" disabled={running} onClick={() => capture([p.id], "desktop")} className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-50">التقاط Desktop</button>
                  <button type="button" disabled={running} onClick={() => capture([p.id], "desktop_mobile")} className="btn-primary px-2.5 py-1.5 text-xs disabled:opacity-50">Desktop + Mobile</button>
                </div>
                {row.error && <p className="mt-1 text-xs text-red-600">{row.error}</p>}
              </div>
            );
          })}
        </div>

        {/* Footer report */}
        {!running && (counts.success > 0 || counts.error > 0 || counts.noUrl > 0) && (
          <div className="border-t border-brand-100 px-6 py-3 text-sm">
            <span className="text-green-600">✓ نجح: {counts.success}</span>
            {" · "}
            <span className="text-red-600">✕ فشل: {counts.error}</span>
            {" · "}
            <span className="text-amber-600">⚠ بدون رابط: {counts.noUrl}</span>
          </div>
        )}
      </div>

      {/* Confirm close while running */}
      {confirmClose && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card">
            <p className="font-bold text-ink-900">هناك عمليات Screenshot قيد التنفيذ</p>
            <p className="mt-1 text-sm text-gray-600">هل تريد إيقاف المعالجة؟ ستستمر العمليات الجارية على الخادم حتى اكتمالها.</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setConfirmClose(false)} className="btn-primary px-4 py-2 text-sm">الاستمرار</button>
              <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">إيقاف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
