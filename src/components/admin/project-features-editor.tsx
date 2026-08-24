"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Field, Bilingual } from "@/components/admin/fields";
import { IconPicker } from "@/components/admin/icon-picker";
import type { ProjectFeature } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProjectFeatureDraft = Omit<ProjectFeature, "id" | "project_id">;

const empty = (): ProjectFeatureDraft => ({ icon: null, title_ar: "", title_en: "", description_ar: null, description_en: null, sort: 0 });

export function ProjectFeaturesEditor({ value, onChange }: { value: ProjectFeatureDraft[]; onChange: (v: ProjectFeatureDraft[]) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function add() {
    onChange([...value, empty()]);
  }

  function update(i: number, patch: Partial<ProjectFeatureDraft>) {
    onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  }

  function remove(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  function drop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...value];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setDragIndex(null);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-200 p-6 text-center text-sm text-gray-500">لا توجد مميزات بعد.</div>
      ) : (
        value.map((f, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnter={() => dragIndex !== null && dragIndex !== i && drop(i)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            className={cn("rounded-xl border bg-white p-3", dragIndex === i ? "border-brand-400 opacity-60" : "border-brand-100")}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="cursor-grab text-gray-300" title="اسحب للترتيب"><GripVertical className="h-4 w-4" /></span>
              <span className="text-xs font-semibold text-gray-400">ميزة {i + 1}</span>
              <div className="ms-auto flex items-center gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-gray-500 hover:bg-brand-100 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-gray-500 hover:bg-brand-100 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(i)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid gap-3">
              <Field label="الأيقونة"><IconPicker value={f.icon ?? ""} onChange={(name) => update(i, { icon: name })} /></Field>
              <Bilingual label="عنوان الميزة" ar={f.title_ar} en={f.title_en} onAr={(v) => update(i, { title_ar: v })} onEn={(v) => update(i, { title_en: v })} />
              <Bilingual label="الوصف (اختياري)" ar={f.description_ar ?? ""} en={f.description_en ?? ""} onAr={(v) => update(i, { description_ar: v })} onEn={(v) => update(i, { description_en: v })} type="textarea" />
            </div>
          </div>
        ))
      )}

      <button type="button" onClick={add} className="btn-secondary px-4 py-2 text-sm"><Plus className="h-4 w-4" /> إضافة ميزة</button>
    </div>
  );
}
