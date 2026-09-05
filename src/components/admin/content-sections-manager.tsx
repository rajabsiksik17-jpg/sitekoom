"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, Badge } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { cn } from "@/lib/utils";
import type {
  IntroSection, ContactIntroSection, ContactProcessSection, AboutProcessSection, AboutPhilosophySection, AboutCodeSection,
} from "@/lib/content-sections";

type Sections = {
  homepage_intro: IntroSection;
  contact_intro: ContactIntroSection;
  contact_process: ContactProcessSection;
  about_process: AboutProcessSection;
  about_code: AboutCodeSection;
  about_technology: AboutPhilosophySection;
};

const TABS = [
  { key: "homepage_intro", label: "مقدمة الرئيسية" },
  { key: "contact_intro", label: "تواصل — قسم 1" },
  { key: "contact_process", label: "تواصل — قسم 2" },
  { key: "about_process", label: "من نحن — كيف نبني" },
  { key: "about_code", label: "من نحن — كود" },
  { key: "about_technology", label: "من نحن — الفلسفة" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ContentSectionsManager() {
  const { push } = useToast();
  const [sections, setSections] = useState<Sections | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("homepage_intro");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "content_sections").single();
    const raw = ((data?.value ?? {}) as Partial<Sections>);
    setSections({
      homepage_intro: raw.homepage_intro ?? ({} as IntroSection),
      contact_intro: raw.contact_intro ?? ({} as ContactIntroSection),
      contact_process: raw.contact_process ?? ({} as ContactProcessSection),
      about_process: raw.about_process ?? ({} as AboutProcessSection),
      about_code: raw.about_code ?? ({} as AboutCodeSection),
      about_technology: raw.about_technology ?? ({} as AboutPhilosophySection),
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function patch(section: TabKey, p: Record<string, unknown>) {
    setSections((prev) => prev ? { ...prev, [section]: { ...(prev[section] as object), ...p } } : prev);
  }

  async function save() {
    if (!sections) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_settings").upsert({ key: "content_sections", value: sections });
    setSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم حفظ الأقسام التعريفية");
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!sections) return null;

  return (
    <div>
      <PageTitle title="الأقسام التعريفية" description="تحكم في الأقسام التعريفية (Homepage / Contact / About)."
        action={<button type="button" onClick={save} disabled={saving} className="btn-primary px-5 py-2.5"><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ الكل"}</button>} />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={cn("rounded-xl px-4 py-2.5 text-sm font-semibold", activeTab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── homepage_intro ─── */}
      {activeTab === "homepage_intro" && (
        <SectionShell enabled={sections.homepage_intro.enabled ?? true} onToggle={(v) => patch("homepage_intro", { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)"><input className="input" value={sections.homepage_intro.title_ar ?? ""} onChange={(e) => patch("homepage_intro", { title_ar: e.target.value })} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={sections.homepage_intro.title_en ?? ""} onChange={(e) => patch("homepage_intro", { title_en: e.target.value })} /></Field>
            <Field label="الـHighlight (عربي)"><input className="input" value={sections.homepage_intro.highlight_ar ?? ""} onChange={(e) => patch("homepage_intro", { highlight_ar: e.target.value })} /></Field>
            <Field label="Highlight (EN)"><input className="input" dir="ltr" value={sections.homepage_intro.highlight_en ?? ""} onChange={(e) => patch("homepage_intro", { highlight_en: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="النص (عربي)"><textarea className="input min-h-[100px]" value={sections.homepage_intro.desc_ar ?? ""} onChange={(e) => patch("homepage_intro", { desc_ar: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description (EN)"><textarea className="input min-h-[100px]" dir="ltr" value={sections.homepage_intro.desc_en ?? ""} onChange={(e) => patch("homepage_intro", { desc_en: e.target.value })} /></Field></div>
          </div>
          <StringList label="النقاط (عربي)" values={sections.homepage_intro.points_ar ?? []} onChange={(v) => patch("homepage_intro", { points_ar: v })} />
          <StringList label="Points (EN)" values={sections.homepage_intro.points_en ?? []} onChange={(v) => patch("homepage_intro", { points_en: v })} />
          <StringList label="بطاقات المحرر" values={sections.homepage_intro.cards ?? []} onChange={(v) => patch("homepage_intro", { cards: v })} />
        </SectionShell>
      )}

      {/* ─── contact_intro ─── */}
      {activeTab === "contact_intro" && (
        <SectionShell enabled={sections.contact_intro.enabled ?? true} onToggle={(v) => patch("contact_intro", { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)"><input className="input" value={sections.contact_intro.title_ar ?? ""} onChange={(e) => patch("contact_intro", { title_ar: e.target.value })} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={sections.contact_intro.title_en ?? ""} onChange={(e) => patch("contact_intro", { title_en: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="النص (عربي)"><textarea className="input min-h-[100px]" value={sections.contact_intro.desc_ar ?? ""} onChange={(e) => patch("contact_intro", { desc_ar: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description (EN)"><textarea className="input min-h-[100px]" dir="ltr" value={sections.contact_intro.desc_en ?? ""} onChange={(e) => patch("contact_intro", { desc_en: e.target.value })} /></Field></div>
          </div>
          <StringList label="النقاط (عربي)" values={sections.contact_intro.points_ar ?? []} onChange={(v) => patch("contact_intro", { points_ar: v })} />
          <StringList label="Points (EN)" values={sections.contact_intro.points_en ?? []} onChange={(v) => patch("contact_intro", { points_en: v })} />
        </SectionShell>
      )}

      {/* ─── contact_process ─── */}
      {activeTab === "contact_process" && (
        <SectionShell enabled={sections.contact_process.enabled ?? true} onToggle={(v) => patch("contact_process", { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)"><input className="input" value={sections.contact_process.title_ar ?? ""} onChange={(e) => patch("contact_process", { title_ar: e.target.value })} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={sections.contact_process.title_en ?? ""} onChange={(e) => patch("contact_process", { title_en: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="النص (عربي)"><textarea className="input min-h-[100px]" value={sections.contact_process.desc_ar ?? ""} onChange={(e) => patch("contact_process", { desc_ar: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description (EN)"><textarea className="input min-h-[100px]" dir="ltr" value={sections.contact_process.desc_en ?? ""} onChange={(e) => patch("contact_process", { desc_en: e.target.value })} /></Field></div>
          </div>
          <BilingualList items={(sections.contact_process.steps ?? []).map((s) => ({ ar: s.ar, en: s.en }))} onChange={(v) => patch("contact_process", { steps: v.map((s) => ({ ar: s.ar, en: s.en })) })} />
        </SectionShell>
      )}

      {/* ─── about_process ─── */}
      {activeTab === "about_process" && (
        <SectionShell enabled={sections.about_process.enabled ?? true} onToggle={(v) => patch("about_process", { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)"><input className="input" value={sections.about_process.title_ar ?? ""} onChange={(e) => patch("about_process", { title_ar: e.target.value })} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={sections.about_process.title_en ?? ""} onChange={(e) => patch("about_process", { title_en: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="الوصف (عربي)"><textarea className="input min-h-[100px]" value={sections.about_process.desc_ar ?? ""} onChange={(e) => patch("about_process", { desc_ar: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description (EN)"><textarea className="input min-h-[100px]" dir="ltr" value={sections.about_process.desc_en ?? ""} onChange={(e) => patch("about_process", { desc_en: e.target.value })} /></Field></div>
          </div>
          <StepList
            steps={(sections.about_process.steps ?? []).map((s) => ({ title_ar: s.ar.title, title_en: s.en.title, desc_ar: s.ar.desc, desc_en: s.en.desc, icon: s.icon }))}
            onChange={(v) => patch("about_process", { steps: v.map((s) => ({ ar: { title: s.title_ar, desc: s.desc_ar }, en: { title: s.title_en, desc: s.desc_en }, icon: s.icon })) })}
          />
        </SectionShell>
      )}

      {/* ─── about_code ─── */}
      {activeTab === "about_code" && (
        <SectionShell enabled={sections.about_code.enabled ?? true} onToggle={(v) => patch("about_code", { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)"><input className="input" value={sections.about_code.title_ar ?? ""} onChange={(e) => patch("about_code", { title_ar: e.target.value })} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={sections.about_code.title_en ?? ""} onChange={(e) => patch("about_code", { title_en: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="النص (عربي)"><textarea className="input min-h-[100px]" value={sections.about_code.desc_ar ?? ""} onChange={(e) => patch("about_code", { desc_ar: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description (EN)"><textarea className="input min-h-[100px]" dir="ltr" value={sections.about_code.desc_en ?? ""} onChange={(e) => patch("about_code", { desc_en: e.target.value })} /></Field></div>
            <Field label="اسم الملف"><input className="input" dir="ltr" value={sections.about_code.filename ?? ""} onChange={(e) => patch("about_code", { filename: e.target.value })} /></Field>
            <Field label="الأكواد (Tabs)" hint="افصل بينها بفاصلة"><input className="input" dir="ltr" value={(sections.about_code.tabs ?? []).join(", ")} onChange={(e) => patch("about_code", { tabs: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></Field>
          </div>
        </SectionShell>
      )}

      {/* ─── about_technology ─── */}
      {activeTab === "about_technology" && (
        <SectionShell enabled={sections.about_technology.enabled ?? true} onToggle={(v) => patch("about_technology", { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)"><input className="input" value={sections.about_technology.title_ar ?? ""} onChange={(e) => patch("about_technology", { title_ar: e.target.value })} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={sections.about_technology.title_en ?? ""} onChange={(e) => patch("about_technology", { title_en: e.target.value })} /></Field>
            <Field label="الـHighlight (عربي)"><input className="input" value={sections.about_technology.highlight_ar ?? ""} onChange={(e) => patch("about_technology", { highlight_ar: e.target.value })} /></Field>
            <Field label="Highlight (EN)"><input className="input" dir="ltr" value={sections.about_technology.highlight_en ?? ""} onChange={(e) => patch("about_technology", { highlight_en: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="الوصف (عربي)"><textarea className="input min-h-[100px]" value={sections.about_technology.desc_ar ?? ""} onChange={(e) => patch("about_technology", { desc_ar: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Description (EN)"><textarea className="input min-h-[100px]" dir="ltr" value={sections.about_technology.desc_en ?? ""} onChange={(e) => patch("about_technology", { desc_en: e.target.value })} /></Field></div>
          </div>
          <BilingualList items={(sections.about_technology.items ?? []).map((i) => ({ ar: { title: i.ar.title, desc: i.ar.desc }, en: { title: i.en.title, desc: i.en.desc } }))} onChange={(v) => patch("about_technology", { items: v.map((i) => ({ ar: i.ar, en: i.en })) })} />
        </SectionShell>
      )}
    </div>
  );
}

function SectionShell({ enabled, onToggle, children }: { enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="card space-y-5 p-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onToggle(!enabled)}>
          <Badge color={enabled ? "green" : "gray"}>{enabled ? "مفعّل" : "معطّل"}</Badge>
        </button>
      </div>
      {children}
    </div>
  );
}

function StringList({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <Field label={label}>
        <div className="space-y-2">
          {(values ?? []).map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="input" value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} />
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => onChange([...(values ?? []), ""])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة</button>
        </div>
      </Field>
    </div>
  );
}

type BiItem = { ar: string | { title: string; desc: string }; en: string | { title: string; desc: string } };

function BilingualList({ items, onChange }: { items: BiItem[]; onChange: (v: BiItem[]) => void }) {
  const norm = (x: string | { title: string; desc: string }) => (typeof x === "string" ? { title: x, desc: "" } : x);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const a = norm(it.ar);
        const e = norm(it.en);
        return (
          <div key={i} className="rounded-xl border border-brand-100 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="العنوان (عربي)" value={a.title} onChange={(ev) => onChange(items.map((x, j) => j === i ? { ar: { title: ev.target.value, desc: a.desc }, en: x.en } : x))} />
              <input className="input" dir="ltr" placeholder="Title (EN)" value={e.title} onChange={(ev) => onChange(items.map((x, j) => j === i ? { ar: x.ar, en: { title: ev.target.value, desc: e.desc } } : x))} />
            </div>
            {a.desc !== undefined && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className="input" placeholder="الوصف (عربي)" value={a.desc} onChange={(ev) => onChange(items.map((x, j) => j === i ? { ar: { title: a.title, desc: ev.target.value }, en: x.en } : x))} />
                <input className="input" dir="ltr" placeholder="Desc (EN)" value={e.desc} onChange={(ev) => onChange(items.map((x, j) => j === i ? { ar: x.ar, en: { title: e.title, desc: ev.target.value } } : x))} />
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...items, { ar: { title: "", desc: "" }, en: { title: "", desc: "" } }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة</button>
    </div>
  );
}

function StepList({ steps, onChange }: { steps: { title_ar: string; title_en: string; desc_ar: string; desc_en: string; icon: string }[]; onChange: (v: typeof steps) => void }) {
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="rounded-xl border border-brand-100 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="العنوان (عربي)" value={s.title_ar} onChange={(e) => onChange(steps.map((x, j) => (j === i ? { ...x, title_ar: e.target.value } : x)))} />
            <input className="input" dir="ltr" placeholder="Title (EN)" value={s.title_en} onChange={(e) => onChange(steps.map((x, j) => (j === i ? { ...x, title_en: e.target.value } : x)))} />
            <input className="input" placeholder="الوصف (عربي)" value={s.desc_ar} onChange={(e) => onChange(steps.map((x, j) => (j === i ? { ...x, desc_ar: e.target.value } : x)))} />
            <input className="input" dir="ltr" placeholder="Desc (EN)" value={s.desc_en} onChange={(e) => onChange(steps.map((x, j) => (j === i ? { ...x, desc_en: e.target.value } : x)))} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input className="input w-40" placeholder="Icon" dir="ltr" value={s.icon} onChange={(e) => onChange(steps.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} />
            <button type="button" onClick={() => onChange(steps.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => { const copy = [...steps]; const [m] = copy.splice(i, 1); copy.splice(Math.max(0, i - 1), 0, m); onChange(copy); }} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => { const copy = [...steps]; const [m] = copy.splice(i, 1); copy.splice(Math.min(copy.length, i + 1), 0, m); onChange(copy); }} className="rounded-lg p-2 text-gray-500 hover:bg-brand-50"><ChevronDown className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...steps, { title_ar: "", title_en: "", desc_ar: "", desc_en: "", icon: "check-circle" }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة مرحلة</button>
    </div>
  );
}
