"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal, Spinner, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

export function MediaPickerModal({
  open,
  onClose,
  accept,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  accept: "image" | "video";
  onSelect: (url: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const all = (data ?? []) as MediaItem[];
        setItems(
          all.filter((m) =>
            accept === "video" ? (m.mime_type ?? "").startsWith("video/") : !(m.mime_type ?? "").startsWith("video/"),
          ),
        );
        setLoading(false);
      });
  }, [open, accept]);

  const filtered = items.filter((m) => !query || (m.name ?? "").toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title="اختر من مكتبة الوسائط" size="lg">
      <div className="mb-4">
        <input className="input" placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد وسائط" description="ارفع ملفاتك من مكتبة الوسائط أولًا." />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m.url);
                onClose();
              }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border border-brand-100 bg-black transition-colors hover:border-brand-400",
              )}
            >
              {accept === "video" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <video src={m.url} muted className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><Play className="h-6 w-6 text-white/80" /></span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.name ?? ""} loading="lazy" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
