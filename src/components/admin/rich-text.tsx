"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading2, Heading3, Link2, RemoveFormatting } from "lucide-react";

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichText({
  value,
  onChange,
  minHeight = 200,
}: {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tools = [
    { icon: Bold, label: "غامق", action: () => exec("bold") },
    { icon: Italic, label: "مائل", action: () => exec("italic") },
    { icon: Underline, label: "تحته خط", action: () => exec("underline") },
    { icon: Heading2, label: "عنوان", action: () => exec("formatBlock", "H2") },
    { icon: Heading3, label: "عنوان فرعي", action: () => exec("formatBlock", "H3") },
    { icon: List, label: "قائمة", action: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "قائمة مرقمة", action: () => exec("insertOrderedList") },
    { icon: Quote, label: "اقتباس", action: () => exec("formatBlock", "BLOCKQUOTE") },
    { icon: Link2, label: "رابط", action: () => { const url = prompt("أدخل الرابط:"); if (url) exec("createLink", url); } },
    { icon: RemoveFormatting, label: "إزالة التنسيق", action: () => exec("removeFormat") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-brand-100">
      <div className="flex flex-wrap gap-1 border-b border-brand-100 bg-brand-50/50 p-2">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.action}
            className="rounded-lg p-2 text-gray-600 hover:bg-brand-100"
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        dir="auto"
        className="prose-site max-w-none p-4 outline-none"
        style={{ minHeight }}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}
