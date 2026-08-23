"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Star, GripVertical } from "lucide-react";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { FileUpload } from "@/components/admin/file-upload";
import { PORTFOLIO_FIELD_TYPES, portfolioFieldType, SITE_PAGES, type PortfolioKind } from "@/lib/portfolio";
import type { PortfolioItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PortfolioItemDraft = Omit<PortfolioItem, "id" | "project_id" | "service_id" | "created_at" | "updated_at">;

const BUTTON_STYLES = ["primary", "secondary", "outline", "ghost"];
const BUTTON_ACTIONS = ["open", "new_tab", "download"];

const emptyItem = (type: string, sort: number): PortfolioItemDraft => ({
  type,
  title_ar: null, title_en: null,
  description_ar: null, description_en: null,
  caption_ar: null, caption_en: null,
  alt_ar: null, alt_en: null,
  url: null, thumbnail: null, platform: null, icon: null,
  button_text_ar: null, button_text_en: null,
  button_style: "primary", button_action: "open", display_mode: null,
  is_visible: true, is_featured: false, sort, data: {},
});

export function PortfolioEditor({
  enabled,
  value,
  onChange,
}: {
  enabled: string[];
  value: PortfolioItemDraft[];
  onChange: (items: PortfolioItemDraft[]) => void;
}) {
  const enabledTypes = PORTFOLIO_FIELD_TYPES.filter((t) => enabled.includes(t.key));
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function addItem(type: string) {
    onChange([...value, emptyItem(type, value.length)]);
  }

  function updateItem(index: number, patch: Partial<PortfolioItemDraft>) {
    onChange(value.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveItem(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function onDrop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...value];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setDragIndex(null);
    onChange(next);
  }

  if (enabledTypes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-200 p-6 text-center text-sm text-gray-500">
        لم يتم تفعيل أي نوع محتوى لهذه الخدمة. فعّل أنواع المحتوى من إعدادات الخدمة (Portfolio).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-brand-100 p-3">
        <span className="self-center text-sm font-semibold text-ink-900">إضافة محتوى:</span>
        {enabledTypes.map((t) => (
          <button key={t.key} type="button" onClick={() => addItem(t.key)} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
            <Plus className="me-1 inline h-3.5 w-3.5" /> {t.labelAr}
          </button>
        ))}
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-200 p-6 text-center text-sm text-gray-500">لا يوجد محتوى بعد.</div>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <ItemRow
              key={index}
              item={item}
              index={index}
              total={value.length}
              dragIndex={dragIndex}
              onDragStart={() => setDragIndex(index)}
              onDragEnter={() => dragIndex !== null && dragIndex !== index && onDrop(index)}
              onDragEnd={() => setDragIndex(null)}
              onUpdate={(p) => updateItem(index, p)}
              onRemove={() => removeItem(index)}
              onMove={(d) => moveItem(index, d)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  index,
  total,
  dragIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onUpdate,
  onRemove,
  onMove,
}: {
  item: PortfolioItemDraft;
  index: number;
  total: number;
  dragIndex: number | null;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onUpdate: (patch: Partial<PortfolioItemDraft>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const def = portfolioFieldType(item.type);
  const kind = def?.kind ?? "text";
  const [collapsed, setCollapsed] = useState(false);

  function set(field: keyof PortfolioItemDraft, v: unknown) {
    onUpdate({ [field]: v } as Partial<PortfolioItemDraft>);
  }

  const isSingleLink = ["website_url", "google_play", "app_store"].includes(item.type);
  const isImage = kind === "image";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn("rounded-xl border bg-white p-3", dragIndex === index ? "border-brand-400 opacity-60" : "border-brand-100")}
    >
      <div className="flex items-center gap-2">
        <span className="cursor-grab text-gray-300" title="اسحب للترتيب"><GripVertical className="h-4 w-4" /></span>
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">{def?.labelAr ?? item.type}</span>
        <span className="text-xs text-gray-400">{index + 1}</span>

        <div className="ms-auto flex items-center gap-1">
          <button type="button" onClick={() => onUpdate({ is_visible: !item.is_visible })} title={item.is_visible ? "إخفاء" : "إظهار"} className="rounded p-1 text-gray-500 hover:bg-brand-100">
            {item.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => onUpdate({ is_featured: !item.is_featured })} title="مميز" className={cn("rounded p-1", item.is_featured ? "text-amber-500" : "text-gray-400 hover:bg-brand-100")}>
            <Star className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ data: { ...(item.data ?? {}), before_description: !(item.data?.before_description as boolean) } })}
            title="عرض قبل وصف المشروع"
            className={cn("rounded px-2 py-1 text-[11px] font-semibold", item.data?.before_description ? "bg-brand-100 text-brand-700" : "text-gray-400 hover:bg-brand-100")}
          >
            قبل الوصف
          </button>
          <button type="button" onClick={() => setCollapsed((v) => !v)} className="rounded px-1 text-xs font-semibold text-gray-400 hover:bg-brand-100">{collapsed ? "فتح" : "طي"}</button>
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded p-1 text-gray-500 hover:bg-brand-100 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="rounded p-1 text-gray-500 hover:bg-brand-100 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
          <button type="button" onClick={onRemove} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 grid gap-3 border-t border-brand-50 pt-3">
          {kind === "text" && (
            <Bilingual label="العنوان" ar={item.title_ar ?? ""} en={item.title_en ?? ""} onAr={(v) => set("title_ar", v)} onEn={(v) => set("title_en", v)} />
          )}
          {kind === "text" && (
            <Bilingual label="المحتوى / الوصف" ar={item.description_ar ?? ""} en={item.description_en ?? ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} type="textarea" />
          )}

          {isImage && (
            <>
              <Field label={item.type === "website_screenshot" ? "صورة الموقع الكاملة (طويلة)" : "الصورة"}><ImageUpload value={item.url ?? ""} onChange={(u) => set("url", u)} folder="projects" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان (عربي)"><input className="input" value={item.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></Field>
                <Field label="Title (EN)"><input className="input" dir="ltr" value={item.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Alt (عربي)"><input className="input" value={item.alt_ar ?? ""} onChange={(e) => set("alt_ar", e.target.value)} /></Field>
                <Field label="Alt (EN)"><input className="input" dir="ltr" value={item.alt_en ?? ""} onChange={(e) => set("alt_en", e.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Caption (عربي)"><input className="input" value={item.caption_ar ?? ""} onChange={(e) => set("caption_ar", e.target.value)} /></Field>
                <Field label="Caption (EN)"><input className="input" dir="ltr" value={item.caption_en ?? ""} onChange={(e) => set("caption_en", e.target.value)} /></Field>
              </div>
            </>
          )}

          {kind === "video" && (
            <>
              <Field label="رابط الفيديو (YouTube / Vimeo / خارجي)"><input className="input" dir="ltr" value={item.url ?? ""} onChange={(e) => set("url", e.target.value)} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان (عربي)"><input className="input" value={item.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></Field>
                <Field label="Title (EN)"><input className="input" dir="ltr" value={item.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></Field>
              </div>
              <Bilingual label="الوصف" ar={item.description_ar ?? ""} en={item.description_en ?? ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} type="textarea" />
              <Field label="Thumbnail"><ImageUpload value={item.thumbnail ?? ""} onChange={(u) => set("thumbnail", u)} folder="projects" /></Field>
            </>
          )}

          {kind === "file" && (
            <>
              <Field label="الملف"><FileUpload value={item.url ?? ""} onChange={(u) => set("url", u)} folder="projects" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان (عربي)"><input className="input" value={item.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></Field>
                <Field label="Title (EN)"><input className="input" dir="ltr" value={item.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></Field>
              </div>
              <Bilingual label="الوصف" ar={item.description_ar ?? ""} en={item.description_en ?? ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} type="textarea" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نص الزر (عربي)"><input className="input" value={item.button_text_ar ?? ""} onChange={(e) => set("button_text_ar", e.target.value)} /></Field>
                <Field label="Button (EN)"><input className="input" dir="ltr" value={item.button_text_en ?? ""} onChange={(e) => set("button_text_en", e.target.value)} /></Field>
              </div>
            </>
          )}

          {kind === "link" && (
            <>
              {item.type === "social_links" && (
                <Field label="المنصة">
                  <select className="input" value={item.platform ?? ""} onChange={(e) => set("platform", e.target.value)}>
                    {["facebook", "instagram", "linkedin", "x", "youtube", "tiktok", "snapchat", "whatsapp", "telegram", "github", "behance", "dribbble"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              )}
              {item.type !== "button" && (
                <Field label="الرابط (URL)"><input className="input" dir="ltr" value={item.url ?? ""} onChange={(e) => set("url", e.target.value)} /></Field>
              )}

              {item.type === "button" && (
                <>
                  <Field label="هدف الزر">
                    <select className="input" value={String(item.data?.link_type ?? "custom")} onChange={(e) => set("data", { ...(item.data ?? {}), link_type: e.target.value })}>
                      <option value="custom">رابط مخصص (Custom URL)</option>
                      <option value="internal">صفحة داخلية من الموقع</option>
                    </select>
                  </Field>
                  {String(item.data?.link_type ?? "custom") === "internal" ? (
                    <Field label="الصفحة الداخلية">
                      <select className="input" value={String(item.data?.internal_page ?? "")} onChange={(e) => set("data", { ...(item.data ?? {}), internal_page: e.target.value })}>
                        <option value="">اختر صفحة...</option>
                        {SITE_PAGES.map((p) => <option key={p.key} value={p.key}>{p.labelAr}</option>)}
                      </select>
                    </Field>
                  ) : (
                    <Field label="Custom URL"><input className="input" dir="ltr" placeholder="https://example.com أو /contact" value={item.url ?? ""} onChange={(e) => set("url", e.target.value)} /></Field>
                  )}
                  <Field label="أيقونة الزر (اختياري — اسم أيقونة)"><input className="input" dir="ltr" placeholder="arrow-right, external-link..." value={item.icon ?? ""} onChange={(e) => set("icon", e.target.value)} /></Field>
                </>
              )}

              {!isSingleLink && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="العنوان (عربي)"><input className="input" value={item.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></Field>
                    <Field label="Title (EN)"><input className="input" dir="ltr" value={item.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></Field>
                  </div>
                  <Bilingual label="الوصف" ar={item.description_ar ?? ""} en={item.description_en ?? ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} type="textarea" />
                </>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نص الزر (عربي)"><input className="input" value={item.button_text_ar ?? ""} onChange={(e) => set("button_text_ar", e.target.value)} /></Field>
                <Field label="Button (EN)"><input className="input" dir="ltr" value={item.button_text_en ?? ""} onChange={(e) => set("button_text_en", e.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نمط الزر">
                  <select className="input" value={item.button_style ?? "primary"} onChange={(e) => set("button_style", e.target.value)}>
                    {BUTTON_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="السلوك">
                  <select className="input" value={item.button_action ?? "open"} onChange={(e) => set("button_action", e.target.value)}>
                    {BUTTON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          {kind === "media" && (
            <>
              {item.type === "audio" && <Field label="ملف الصوت"><FileUpload value={item.url ?? ""} onChange={(u) => set("url", u)} folder="projects" /></Field>}
              {item.type === "location" && <Field label="رابط Google Maps"><input className="input" dir="ltr" value={item.url ?? ""} onChange={(e) => set("url", e.target.value)} /></Field>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان (عربي)"><input className="input" value={item.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></Field>
                <Field label="Title (EN)"><input className="input" dir="ltr" value={item.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></Field>
              </div>
              <Bilingual label="الوصف / العنوان" ar={item.description_ar ?? ""} en={item.description_en ?? ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} type="textarea" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
