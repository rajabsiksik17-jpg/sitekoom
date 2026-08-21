"use client";

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Bilingual({
  label,
  ar,
  en,
  onAr,
  onEn,
  type = "input",
  required,
}: {
  label: string;
  ar: string;
  en: string;
  onAr: (v: string) => void;
  onEn: (v: string) => void;
  type?: "input" | "textarea";
  required?: boolean;
}) {
  const shared = type === "textarea" ? { className: "input min-h-[100px]", rows: 4 } : { className: "input" };
  return (
    <div className="space-y-2 rounded-xl border border-brand-100 p-4">
      <p className="text-sm font-semibold text-ink-900">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs text-gray-400">العربية</span>
          {type === "textarea" ? (
            <textarea dir="rtl" {...shared} value={ar} onChange={(e) => onAr(e.target.value)} />
          ) : (
            <input dir="rtl" {...shared} value={ar} onChange={(e) => onAr(e.target.value)} />
          )}
        </div>
        <div>
          <span className="mb-1 block text-xs text-gray-400">English</span>
          {type === "textarea" ? (
            <textarea dir="ltr" {...shared} value={en} onChange={(e) => onEn(e.target.value)} />
          ) : (
            <input dir="ltr" {...shared} value={en} onChange={(e) => onEn(e.target.value)} />
          )}
        </div>
      </div>
    </div>
  );
}
