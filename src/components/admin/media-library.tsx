"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, Copy, Search, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, validateImage, validateVideo } from "@/lib/upload";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState, ConfirmDialog } from "@/components/admin/ui";
import type { MediaItem } from "@/lib/types";

export function MediaLibrary() {
  const { push } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("media").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as MediaItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const supabase = createClient();
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const err = isVideo ? validateVideo(file) : validateImage(file);
      if (err) { push("error", err); continue; }
      try {
        const { url } = await uploadFile("media", file, "library");
        await supabase.from("media").insert({ url, name: file.name, mime_type: file.type, size: file.size, folder: "library", alt: "" });
      } catch (e) {
        push("error", e instanceof Error ? e.message : "فشل الرفع");
      }
    }
    setUploading(false);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("media").delete().eq("id", deleting.id);
    setDeleting(null);
    push("success", "تم الحذف");
    load();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => push("success", "تم نسخ الرابط"));
  }

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase();
    if (q && !(i.name ?? "").toLowerCase().includes(q)) return false;
    if (filter === "image") return !(i.mime_type ?? "").startsWith("video/");
    if (filter === "video") return (i.mime_type ?? "").startsWith("video/");
    return true;
  });

  return (
    <div>
      <PageTitle title="مكتبة الوسائط" description="رفع وإدارة الصور والفيديوهات وملفات GIF."
        action={<button type="button" onClick={() => inputRef.current?.click()} className="btn-primary px-4 py-2.5" disabled={uploading}><Upload className="h-4 w-4" /> {uploading ? "جارٍ الرفع..." : "رفع ملفات"}</button>} />

      <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input className="input ps-10" placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["all", "image", "video"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === f ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
              {f === "all" ? "الكل" : f === "image" ? "صور" : "فيديو"}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner /></div> : filtered.length === 0 ? (
        <EmptyState title="لا توجد وسائط" description="ارفع صورك وفيديوهاتك هنا لإعادة استخدامها." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((m) => {
            const isVideo = (m.mime_type ?? "").startsWith("video/");
            return (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-brand-100 bg-black">
                {isVideo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <video src={m.url} muted className="h-full w-full object-cover" />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/80" />
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name ?? ""} loading="lazy" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-900/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => copyUrl(m.url)} className="rounded-lg bg-white p-2 text-ink-900" title="نسخ الرابط"><Copy className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleting(m)} className="rounded-lg bg-white p-2 text-red-600" title="حذف"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleting} title="حذف الوسائط" message="هل أنت متأكد من الحذف؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
