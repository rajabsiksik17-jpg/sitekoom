"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkActionDef {
  key: string;
  label: string;
  danger?: boolean;
}

/**
 * Reusable bulk selection state for any list of ids.
 */
export function useBulkSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }, [ids]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const count = selected.size;
  const allSelected = ids.length > 0 && count === ids.length;

  return { selected, toggle, toggleAll, clear, count, allSelected, any: count > 0 };
}

/**
 * Sticky premium bulk actions bar. Shown only when `count > 0`.
 */
export function BulkActionsBar({
  count,
  singular,
  plural,
  actions,
  onAction,
  onCancel,
  busy,
  mobileMenu,
}: {
  count: number;
  singular: string;
  plural: string;
  actions: BulkActionDef[];
  onAction: (key: string) => void;
  onCancel: () => void;
  busy?: boolean;
  mobileMenu?: boolean;
}) {
  const label = `تم تحديد ${count} ${count === 1 ? singular : plural}`;

  return (
    <div className="sticky top-16 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200/70 bg-white/85 px-4 py-3 shadow-glow backdrop-blur-md">
      <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
        <CheckSquare className="h-4 w-4 text-brand-600" />
        {label}
      </span>
      <div className={cn("flex flex-wrap gap-2", mobileMenu && "max-sm:max-w-full max-sm:overflow-x-auto max-sm:pb-1")}>
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            disabled={busy}
            onClick={() => onAction(a.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50",
              a.danger ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-brand-50 text-brand-700 hover:bg-brand-100",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={onCancel} disabled={busy} className="ms-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-500 hover:bg-brand-50 disabled:opacity-50">
        <X className="h-4 w-4" /> إلغاء
      </button>
    </div>
  );
}
