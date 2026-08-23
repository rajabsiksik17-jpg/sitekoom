"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X, Link2 } from "lucide-react";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/components/admin/toast";

export function FileUpload({
  value,
  onChange,
  folder = "general",
  accept,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
}) {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const { url } = await uploadFile("media", file, folder);
      onChange(url);
      push("success", "تم رفع الملف بنجاح");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل رفع الملف");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-600" dir="ltr">{value}</span>
          <button type="button" onClick={() => onChange("")} className="rounded p-1 text-red-500 hover:bg-red-50"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary px-3 py-2 text-sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} {loading ? "جارٍ الرفع..." : "رفع ملف"}
          </button>
          <button type="button" onClick={() => setManual((v) => !v)} className="btn-secondary px-3 py-2 text-sm">
            <Link2 className="h-4 w-4" /> رابط
          </button>
        </div>
      )}

      {manual && (
        <input className="input" dir="ltr" placeholder="https://..." value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
