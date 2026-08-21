"use client";

import { useRef, useState } from "react";
import { Clapperboard, Loader2, X, Library } from "lucide-react";
import { uploadFile, validateVideo } from "@/lib/upload";
import { useToast } from "@/components/admin/toast";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";

export function VideoUpload({
  value,
  onChange,
  folder = "company",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const err = validateVideo(file);
    if (err) return push("error", err);
    setLoading(true);
    try {
      const { url } = await uploadFile("media", file, folder);
      onChange(url);
      push("success", "تم رفع الفيديو بنجاح");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل رفع الفيديو");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <video src={value} className="h-28 w-44 rounded-xl border border-brand-100 bg-black object-cover" muted />
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-ink-900/50 opacity-0 transition-opacity hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-white p-1.5 text-ink-900">
              <Clapperboard className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setPickerOpen(true)} className="rounded-lg bg-white p-1.5 text-ink-900">
              <Library className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onChange("")} className="rounded-lg bg-white p-1.5 text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-44 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 text-brand-500 hover:bg-brand-50"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Clapperboard className="h-6 w-6" />}
            <span className="text-xs">{loading ? "جارٍ الرفع..." : "رفع فيديو"}</span>
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-28 w-44 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 text-brand-500 hover:bg-brand-50"
          >
            <Library className="h-6 w-6" />
            <span className="text-xs">من المكتبة</span>
          </button>
        </div>
      )}

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} accept="video" onSelect={onChange} />
    </div>
  );
}
