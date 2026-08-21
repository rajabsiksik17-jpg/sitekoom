"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadFile, validateImage } from "@/lib/upload";
import { useToast } from "@/components/admin/toast";

export function ImageUpload({
  value,
  onChange,
  bucket = "media",
  folder = "general",
}: {
  value: string;
  onChange: (url: string) => void;
  bucket?: "media" | "avatars";
  folder?: string;
}) {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const err = validateImage(file);
    if (err) return push("error", err);
    setLoading(true);
    try {
      const { url } = await uploadFile(bucket, file, folder);
      onChange(url);
      push("success", "تم رفع الصورة بنجاح");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="h-28 w-40 rounded-xl border border-brand-100 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-ink-900/50 opacity-0 transition-opacity hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-white p-1.5 text-ink-900">
              <ImagePlus className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onChange("")} className="rounded-lg bg-white p-1.5 text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-40 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 text-brand-500 hover:bg-brand-50"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs">{loading ? "جارٍ الرفع..." : "رفع صورة"}</span>
        </button>
      )}
    </div>
  );
}
