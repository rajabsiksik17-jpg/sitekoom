"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Icon, ICON_NAMES } from "@/components/icon";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_NAMES;
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="rounded-xl border border-brand-100 p-3">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg bg-gray-50 py-2 ps-9 pe-3 text-sm outline-none"
          placeholder="ابحث عن أيقونة..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto sm:grid-cols-8">
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            title={name}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border transition-colors",
              value === name
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-transparent text-gray-500 hover:bg-brand-50 hover:text-brand-700",
            )}
          >
            <Icon name={name} className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
