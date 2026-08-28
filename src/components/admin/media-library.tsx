"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, Copy, Search, Play, FileText, File, Layers, Merge } from "lucide-react";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState, ConfirmDialog } from "@/components/admin/ui";
import { cn, formatBytes } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

type UsageMap = Record<string, string[]>;
type TypeFilter = "all" | "image" | "video" | "gif" | "pdf" | "document" | "other";

function typeOf(m: MediaItem): TypeFilter {
  const t = (m.mime_type ?? "").toLowerCase();
  if (t === "image/gif") return "gif";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t === "application/pdf") return "pdf";
  if (t.includes("word") || t.includes("text") || t.includes("document") || t.includes("sheet") || t.includes("presentation")) return "document";
  return "other";
}

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "image", label: "صور" },
  { key: "video", label: "فيديو" },
  { key: "gif", label: "GIF" },
  { key: "pdf", label: "PDF" },
  { key: "document", label: "مستندات" },
  { key: "other", label: "أخرى" },
];

export function MediaLibrary() {
  const { push } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [usage, setUsage] = useState<UsageMap>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const [merging, setMerging] = useState<{ group: MediaItem[]; keepId: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "error");
      setItems((d.items ?? []) as MediaItem[]);
      setUsage((d.usage ?? {}) as UsageMap);
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    let duplicated = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "library");
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "فشل الرفع");
        if (d.duplicated) duplicated++;
      } catch (e) {
        push("error", e instanceof Error ? e.message : "فشل الرفع");
      }
    }
    setUploading(false);
    if (duplicated) push("success", `تم استخدام ${duplicated} ملف موجود مسبقًا بدل الرفع`);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/media?id=${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "error");
      setDeleting(null);
      push("success", "تم الحذف");
      load();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الحذف");
      setDeleting(null);
    }
  }

  async function confirmMerge() {
    if (!merging) return;
    const duplicateIds = merging.group.filter((m) => m.id !== merging.keepId).map((m) => m.id);
    try {
      const res = await fetch("/api/admin/media/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keep_id: merging.keepId, duplicate_ids: duplicateIds }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "error");
      push("success", `تم دمج ${d.merged} ملفات مكررة`);
      setMerging(null);
      load();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الدمج");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => push("success", "تم نسخ الرابط"));
  }

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase();
    if (q && !(i.name ?? "").toLowerCase().includes(q)) return false;
    if (filter !== "all" && typeOf(i) !== filter) return false;
    return true;
  });

  const duplicateGroups = (() => {
    const map = new Map<string, MediaItem[]>();
    for (const m of items) {
      if (!m.hash) continue;
      const arr = map.get(m.hash) ?? [];
      arr.push(m);
      map.set(m.hash, arr);
    }
    return Array.from(map.values()).filter((g) => g.length > 1);
  })();

  return (
    <div>
      <PageTitle
        title="مكتبة الوسائط"
        description="المصدر المركزي لجميع الملفات — رفع، بحث، دمج المكررات."
        action={
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-primary px-4 py-2.5" disabled={uploading}>
            <Upload className="h-4 w-4" /> {uploading ? "جارٍ الرفع..." : "رفع ملفات"}
          </button>
        }
      />

      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />

      {duplicateGroups.length > 0 && (
        <div className="card mb-6 border-amber-200 bg-amber-50/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600" />
            <p className="font-bold text-ink-900">ملفات مكررة مكتشفة ({duplicateGroups.length} مجموعة)</p>
          </div>
          <div className="space-y-2">
            {duplicateGroups.map((g, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-white p-3">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {g.slice(0, 4).map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.url} alt="" className="h-10 w-10 rounded-lg border border-white object-cover" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{g[0].name}</p>
                  <p className="text-xs text-gray-500">{g.length} نسخ • {formatBytes(g.reduce((a, m) => a + (m.size ?? 0), 0))} إجمالي</p>
                </div>
                <button type="button" onClick={() => setMerging({ group: g, keepId: g[0].id })} className="btn-secondary px-3 py-1.5 text-xs">
                  <Merge className="h-3.5 w-3.5" /> دمج
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input className="input ps-10" placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={cn("rounded-lg px-3 py-2 text-sm font-semibold", filter === f.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد وسائط" description="ارفع ملفاتك هنا لإعادة استخدامها في جميع أقسام الموقع." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((m) => {
            const type = typeOf(m);
            const used = usage[m.url] ?? [];
            return (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-brand-100 bg-black">
                {type === "video" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <video src={m.url} muted className="h-full w-full object-cover" />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><Play className="h-8 w-8 text-white/80" /></span>
                  </>
                ) : type === "image" || type === "gif" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name ?? ""} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-50 text-brand-700">
                    {type === "pdf" ? <FileText className="h-10 w-10" /> : <File className="h-10 w-10" />}
                    <span className="max-w-full truncate px-2 text-xs font-semibold">{m.name}</span>
                  </div>
                )}

                {used.length > 0 && <span className="absolute top-2 end-2 rounded-full bg-brand-600/90 px-2 py-0.5 text-[10px] font-bold text-white">مستخدم ({used.length})</span>}

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/70 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => copyUrl(m.url)} className="rounded-lg bg-white p-2 text-ink-900" title="نسخ الرابط"><Copy className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setDeleting(m)} className="rounded-lg bg-white p-2 text-red-600" title="حذف"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <p className="text-center text-[10px] text-white/80">{m.name} • {formatBytes(m.size ?? 0)}</p>
                  {used.length > 0 && <p className="text-center text-[10px] text-brand-200">{used.join("، ")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف الوسائط" message="هل أنت متأكد من الحذف؟ لن يتم الحذف إذا كان الملف مستخدمًا." onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />

      {merging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-h-[80vh] w-full max-w-lg overflow-auto p-6">
            <h3 className="mb-3 font-bold text-ink-900">دمج الملفات المكررة</h3>
            <p className="mb-4 text-sm text-gray-600">اختر النسخة الأساسية التي ستبقى. سيتم تحويل جميع المراجع إليها وحذف النسخ الأخرى.</p>
            <div className="space-y-2">
              {merging.group.map((m) => (
                <label key={m.id} className="flex items-center gap-3 rounded-xl border border-brand-100 p-3">
                  <input type="radio" name="keep" checked={merging.keepId === m.id} onChange={() => setMerging({ ...merging, keepId: m.id })} className="text-brand-600" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{m.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(m.size ?? 0)}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={confirmMerge} className="btn-primary px-4 py-2 text-sm">دمج الملفات</button>
              <button type="button" onClick={() => setMerging(null)} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
