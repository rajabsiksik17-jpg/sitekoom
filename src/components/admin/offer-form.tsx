"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { SeoFields } from "@/components/admin/seo-fields";
import { IconPicker } from "@/components/admin/icon-picker";
import { Icon } from "@/components/icon";
import { Spinner } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import type { Offer, Service, DynamicForm } from "@/lib/types";

type Stage = { title_ar: string; title_en: string; description_ar: string; description_en: string; duration: string; icon: string };
type Included = { title_ar: string; title_en: string; description_ar: string; description_en: string; icon: string; enabled: boolean };
type Group = { id?: string; title_ar: string; title_en: string; selection_type: "single" | "multiple"; required: boolean; allow_deselect: boolean; values: { id?: string; label_ar: string; label_en: string; price: number; is_default: boolean }[] };
type Addon = { title_ar: string; title_en: string; price: number; is_default: boolean };
type Pkg = { name_ar: string; name_en: string; price: number; duration: string; is_default: boolean; features: string };
type Rule = { title_ar: string; title_en: string; field_key: string; operator: string; value: string; price_delta: number };

const emptyStage: Stage = { title_ar: "", title_en: "", description_ar: "", description_en: "", duration: "", icon: "check-circle" };
const emptyIncluded: Included = { title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "check-circle", enabled: true };

export function OfferForm({ offerId }: { offerId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!offerId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [included, setIncluded] = useState<Included[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);

  const [form, setForm] = useState({
    title_ar: "", title_en: "", slug: "", main_image: "", short_desc_ar: "", short_desc_en: "",
    full_desc_ar: "", full_desc_en: "",     base_price: "0", currency: "JOD",
    pricing_type: "simple", price_display: "fixed", duration: "", status: "draft" as string,
    service_ids: [] as string[], form_id: "", cta_text_ar: "", cta_text_en: "", chat_text_ar: "", chat_text_en: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.from("services").select("id,title_ar,title_en").eq("status", "published").is("deleted_at", null).order("sort").then(({ data }) => setServices((data ?? []) as Service[]));
    supabase.from("dynamic_forms").select("id,key,title_ar,title_en,placement").order("sort").then(({ data }) => setForms((data ?? []) as DynamicForm[]));
    if (!offerId) return;

    Promise.all([
      supabase.from("offers").select("*").eq("id", offerId).single(),
      supabase.from("offer_stages").select("*").eq("offer_id", offerId).order("sort"),
      supabase.from("offer_included_items").select("*").eq("offer_id", offerId).order("sort"),
      supabase.from("offer_option_groups").select("*").eq("offer_id", offerId).order("sort"),
      supabase.from("offer_addons").select("*").eq("offer_id", offerId).order("sort"),
      supabase.from("offer_packages").select("*").eq("offer_id", offerId).order("sort"),
      supabase.from("offer_pricing_rules").select("*").eq("offer_id", offerId).order("sort"),
    ]).then(async ([o, st, inc, gr, ad, pk, rl]) => {
      if (o.data) {
        const d = o.data as Offer;
        setForm({
          title_ar: d.title_ar, title_en: d.title_en, slug: d.slug, main_image: d.main_image ?? "",
          short_desc_ar: d.short_desc_ar ?? "", short_desc_en: d.short_desc_en ?? "",
          full_desc_ar: d.full_desc_ar ?? "", full_desc_en: d.full_desc_en ?? "",
          base_price: String(d.base_price ?? 0), currency: d.currency, pricing_type: d.pricing_type,
          price_display: d.price_display, duration: d.duration ?? "", status: d.status,
          service_ids: d.service_ids ?? [], form_id: d.form_id ?? "", cta_text_ar: d.cta_text_ar ?? "", cta_text_en: d.cta_text_en ?? "",
          chat_text_ar: d.chat_text_ar ?? "", chat_text_en: d.chat_text_en ?? "",
        });
      }
      setStages((st.data ?? []).map((x) => ({ title_ar: x.title_ar, title_en: x.title_en, description_ar: x.description_ar ?? "", description_en: x.description_en ?? "", duration: x.duration ?? "", icon: x.icon ?? "check-circle" })));
      setIncluded((inc.data ?? []).map((x) => ({ title_ar: x.title_ar, title_en: x.title_en, description_ar: x.description_ar ?? "", description_en: x.description_en ?? "", icon: x.icon ?? "check-circle", enabled: x.enabled })));
      setAddons((ad.data ?? []).map((x) => ({ title_ar: x.title_ar, title_en: x.title_en, price: Number(x.price), is_default: x.is_default ?? false })));
      setPackages((pk.data ?? []).map((x) => ({ name_ar: x.name_ar, name_en: x.name_en, price: Number(x.price), duration: x.duration ?? "", is_default: x.is_default, features: (x.features ?? []).join(", ") })));
      setRules((rl.data ?? []).map((x) => ({ title_ar: x.title_ar, title_en: x.title_en, field_key: (x.condition as { field_key?: string })?.field_key ?? "", operator: (x.condition as { operator?: string })?.operator ?? "equals", value: String((x.condition as { value?: unknown })?.value ?? ""), price_delta: Number(x.price_delta) })));

      const groupsData = gr.data ?? [];
      if (groupsData.length) {
        const { data: values } = await supabase.from("offer_option_values").select("*").in("option_id", groupsData.map((g) => g.id));
        setGroups(groupsData.map((g) => ({
          id: g.id, title_ar: g.title_ar, title_en: g.title_en, selection_type: g.selection_type, required: g.required, allow_deselect: g.allow_deselect,
          values: (values ?? []).filter((v) => v.option_id === g.id).map((v) => ({ id: v.id, label_ar: v.label_ar, label_en: v.label_en, price: Number(v.price ?? v.price_delta), is_default: v.is_default })),
        })));
      }
      setLoading(false);
    });
  }, [offerId]);

  function update(field: string, value: unknown) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSave() {
    if (!form.title_ar.trim() || !form.title_en.trim()) return push("error", "أدخل العنوان");
    if (!form.slug.trim()) return push("error", "أدخل Slug");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title_ar: form.title_ar, title_en: form.title_en, slug: slugify(form.slug),
      main_image: form.main_image || null, short_desc_ar: form.short_desc_ar || null, short_desc_en: form.short_desc_en || null,
      full_desc_ar: form.full_desc_ar || null, full_desc_en: form.full_desc_en || null,
      base_price: Number(form.base_price) || 0, currency: form.currency, pricing_type: form.pricing_type,
      price_display: form.price_display, duration: form.duration || null, status: form.status,
      service_ids: form.service_ids, form_id: form.form_id || null, cta_text_ar: form.cta_text_ar || null, cta_text_en: form.cta_text_en || null,
      chat_text_ar: form.chat_text_ar || null, chat_text_en: form.chat_text_en || null,
    };

    let id = offerId;
    if (isEdit) {
      const { error } = await supabase.from("offers").update(payload).eq("id", id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { data, error } = await supabase.from("offers").insert(payload).select().single();
      if (error) { setSaving(false); return push("error", error.message); }
      id = data.id;
    }

    await supabase.from("offer_stages").delete().eq("offer_id", id);
    if (stages.length) await supabase.from("offer_stages").insert(stages.map((s, i) => ({ offer_id: id, ...s, sort: i })));

    await supabase.from("offer_included_items").delete().eq("offer_id", id);
    if (included.length) await supabase.from("offer_included_items").insert(included.map((x, i) => ({ offer_id: id, ...x, sort: i })));

    await supabase.from("offer_addons").delete().eq("offer_id", id);
    if (addons.length) await supabase.from("offer_addons").insert(addons.map((a, i) => ({ offer_id: id, ...a, sort: i })));

    await supabase.from("offer_packages").delete().eq("offer_id", id);
    if (packages.length) await supabase.from("offer_packages").insert(packages.map((p, i) => ({ offer_id: id, name_ar: p.name_ar, name_en: p.name_en, price: p.price, duration: p.duration || null, is_default: p.is_default, features: p.features.split(",").map((x) => x.trim()).filter(Boolean), sort: i })));

    await supabase.from("offer_pricing_rules").delete().eq("offer_id", id);
    if (rules.length) await supabase.from("offer_pricing_rules").insert(rules.map((r, i) => ({ offer_id: id, title_ar: r.title_ar, title_en: r.title_en, condition: { field_key: r.field_key, operator: r.operator, value: r.value }, price_delta: r.price_delta, sort: i })));

    await supabase.from("offer_option_groups").delete().eq("offer_id", id);
    for (const g of groups) {
      const { data: grp } = await supabase.from("offer_option_groups").insert({ offer_id: id, title_ar: g.title_ar, title_en: g.title_en, selection_type: g.selection_type, required: g.required, allow_deselect: g.allow_deselect, sort: groups.indexOf(g) }).select().single();
      if (grp && g.values.length) await supabase.from("offer_option_values").insert(g.values.map((v, i) => ({ option_id: grp.id, label_ar: v.label_ar, label_en: v.label_en, price: v.price, is_default: v.is_default, sort: i })));
    }

    setSaving(false);
    push("success", "تم حفظ العرض");
    router.push("/admin/offers");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/offers" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>
      </div>

      <div className="card space-y-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">المعلومات الأساسية</h2>
        <Bilingual label="العنوان" required ar={form.title_ar} en={form.title_en} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug"><input className="input" dir="ltr" value={form.slug} onChange={(e) => update("slug", e.target.value)} /></Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="draft">مسودة</option><option value="published">منشور</option><option value="hidden">مخفي</option>
            </select>
          </Field>
        </div>
        <Field label="نموذج العرض (Offer Form)">
          <select className="input" value={form.form_id} onChange={(e) => update("form_id", e.target.value)}>
            <option value="">— النموذج الافتراضي للعروض —</option>
            {forms.map((f) => <option key={f.id} value={f.id}>{f.title_ar || f.key}</option>)}
          </select>
        </Field>
        <Field label="الصورة الرئيسية"><ImageUpload value={form.main_image} onChange={(u) => update("main_image", u)} folder="offers" /></Field>
        <Bilingual label="وصف مختصر" ar={form.short_desc_ar} en={form.short_desc_en} onAr={(v) => update("short_desc_ar", v)} onEn={(v) => update("short_desc_en", v)} type="textarea" />
        <Bilingual label="وصف كامل" ar={form.full_desc_ar} en={form.full_desc_en} onAr={(v) => update("full_desc_ar", v)} onEn={(v) => update("full_desc_en", v)} type="textarea" />
        <Field label="الخدمات المرتبطة">
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 rounded-lg border border-brand-100 px-3 py-1.5 text-sm">
                <input type="checkbox" checked={form.service_ids.includes(s.id)} onChange={(e) => update("service_ids", e.target.checked ? [...form.service_ids, s.id] : form.service_ids.filter((x) => x !== s.id))} className="rounded border-brand-200 text-brand-600" />
                {s.title_ar}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="card space-y-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">التسعير</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="السعر الأساسي"><input className="input" dir="ltr" type="number" value={form.base_price} onChange={(e) => update("base_price", e.target.value)} /></Field>
          <Field label="العملة"><input className="input" dir="ltr" value={form.currency} onChange={(e) => update("currency", e.target.value)} /></Field>
          <Field label="مدة التنفيذ"><input className="input" value={form.duration} onChange={(e) => update("duration", e.target.value)} /></Field>
          <Field label="نوع التسعير">
            <select className="input" value={form.pricing_type} onChange={(e) => update("pricing_type", e.target.value)}>
              <option value="simple">بسيط</option><option value="options">خيارات</option><option value="addons">إضافات</option><option value="packages">باقات</option><option value="custom_quote">طلب عرض سعر</option>
            </select>
          </Field>
          <Field label="طريقة عرض السعر">
            <select className="input" value={form.price_display} onChange={(e) => update("price_display", e.target.value)}>
              <option value="fixed">سعر ثابت</option><option value="starting_from">يبدأ من</option><option value="request_quote">اطلب عرض سعر</option><option value="hide">إخفاء السعر</option><option value="dynamic">تسعير ديناميكي</option>
            </select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><p className="font-bold text-ink-900">خيارات العرض</p><button type="button" onClick={() => setGroups((g) => [...g, { title_ar: "", title_en: "", selection_type: "single", required: false, allow_deselect: false, values: [] }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> مجموعة خيارات</button></div>
          {groups.map((g, gi) => (
            <div key={gi} className="mb-3 rounded-xl border border-brand-100 p-4">
              <div className="mb-2 flex items-center gap-2">
                <input className="input" placeholder="العنوان (عربي)" value={g.title_ar} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, title_ar: e.target.value } : y))} />
                <input className="input" dir="ltr" placeholder="Title (EN)" value={g.title_en} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, title_en: e.target.value } : y))} />
                <select className="input w-40" value={g.selection_type} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, selection_type: e.target.value as "single" | "multiple" } : y))}>
                  <option value="single">اختيار واحد</option><option value="multiple">اختيار متعدد</option>
                </select>
                <button type="button" onClick={() => setGroups((x) => x.filter((_, i) => i !== gi))} className="rounded p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mb-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-ink-800"><input type="checkbox" checked={g.required} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, required: e.target.checked } : y))} className="rounded border-brand-200 text-brand-600" /> مطلوب</label>
                <label className="flex items-center gap-2 text-xs font-medium text-ink-800"><input type="checkbox" checked={g.allow_deselect} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, allow_deselect: e.target.checked } : y))} className="rounded border-brand-200 text-brand-600" /> السماح بإلغاء الاختيار</label>
              </div>
              {g.values.map((v, vi) => (
                <div key={vi} className="mb-1 flex items-center gap-2">
                  <input className="input" placeholder="العربية" value={v.label_ar} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, values: y.values.map((z, j) => j === vi ? { ...z, label_ar: e.target.value } : z) } : y))} />
                  <input className="input" dir="ltr" placeholder="English" value={v.label_en} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, values: y.values.map((z, j) => j === vi ? { ...z, label_en: e.target.value } : z) } : y))} />
                  <input className="input w-24" dir="ltr" type="number" placeholder="السعر الكامل" value={v.price} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, values: y.values.map((z, j) => j === vi ? { ...z, price: Number(e.target.value) } : z) } : y))} />
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={v.is_default} onChange={(e) => setGroups((x) => x.map((y, i) => i === gi ? { ...y, values: y.values.map((z, j) => j === vi ? { ...z, is_default: e.target.checked } : z) } : y))} /> افتراضي</label>
                  <button type="button" onClick={() => setGroups((x) => x.map((y, i) => i === gi ? { ...y, values: y.values.filter((_, j) => j !== vi) } : y))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setGroups((x) => x.map((y, i) => i === gi ? { ...y, values: [...y.values, { label_ar: "", label_en: "", price: 0, is_default: false }] } : y))} className="mt-1 text-xs font-semibold text-brand-600">+ إضافة قيمة</button>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><p className="font-bold text-ink-900">الإضافات</p><button type="button" onClick={() => setAddons((a) => [...a, { title_ar: "", title_en: "", price: 0, is_default: false }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> إضافة</button></div>
          {addons.map((a, i) => (
            <div key={i} className="mb-1 flex items-center gap-2">
              <input className="input" placeholder="العربية" value={a.title_ar} onChange={(e) => setAddons((x) => x.map((y, j) => j === i ? { ...y, title_ar: e.target.value } : y))} />
              <input className="input" dir="ltr" placeholder="English" value={a.title_en} onChange={(e) => setAddons((x) => x.map((y, j) => j === i ? { ...y, title_en: e.target.value } : y))} />
              <input className="input w-24" dir="ltr" type="number" value={a.price} onChange={(e) => setAddons((x) => x.map((y, j) => j === i ? { ...y, price: Number(e.target.value) } : y))} />
              <label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={a.is_default} onChange={(e) => setAddons((x) => x.map((y, j) => j === i ? { ...y, is_default: e.target.checked } : y))} /> افتراضي (مشمول في السعر)</label>
              <button type="button" onClick={() => setAddons((x) => x.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><p className="font-bold text-ink-900">الباقات</p><button type="button" onClick={() => setPackages((p) => [...p, { name_ar: "", name_en: "", price: 0, duration: "", is_default: false, features: "" }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> باقة</button></div>
          {packages.map((p, i) => (
            <div key={i} className="mb-2 grid gap-2 rounded-xl border border-brand-100 p-3 sm:grid-cols-3">
              <input className="input" placeholder="الاسم (عربي)" value={p.name_ar} onChange={(e) => setPackages((x) => x.map((y, j) => j === i ? { ...y, name_ar: e.target.value } : y))} />
              <input className="input" dir="ltr" placeholder="Name (EN)" value={p.name_en} onChange={(e) => setPackages((x) => x.map((y, j) => j === i ? { ...y, name_en: e.target.value } : y))} />
              <div className="flex items-center gap-2">
                <input className="input" dir="ltr" type="number" value={p.price} onChange={(e) => setPackages((x) => x.map((y, j) => j === i ? { ...y, price: Number(e.target.value) } : y))} />
                <input className="input" placeholder="مدة" value={p.duration} onChange={(e) => setPackages((x) => x.map((y, j) => j === i ? { ...y, duration: e.target.value } : y))} />
                <button type="button" onClick={() => setPackages((x) => x.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <input className="input sm:col-span-2" placeholder="المميزات (مفصولة بفواصل)" value={p.features} onChange={(e) => setPackages((x) => x.map((y, j) => j === i ? { ...y, features: e.target.value } : y))} />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.is_default} onChange={(e) => setPackages((x) => x.map((y, j) => j === i ? { ...y, is_default: e.target.checked } : y))} /> افتراضي</label>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between"><p className="font-bold text-ink-900">قواعد التسعير</p><button type="button" onClick={() => setRules((x) => [...x, { title_ar: "", title_en: "", field_key: "", operator: "equals", value: "", price_delta: 0 }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> قاعدة</button></div>
          {rules.map((r, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
              <input className="input w-40" placeholder="العنوان (عربي)" value={r.title_ar} onChange={(e) => setRules((x) => x.map((y, j) => j === i ? { ...y, title_ar: e.target.value } : y))} />
              <input className="input w-28" dir="ltr" placeholder="field_key" value={r.field_key} onChange={(e) => setRules((x) => x.map((y, j) => j === i ? { ...y, field_key: e.target.value } : y))} />
              <select className="input w-32" value={r.operator} onChange={(e) => setRules((x) => x.map((y, j) => j === i ? { ...y, operator: e.target.value } : y))}>
                <option value="equals">يساوي</option><option value="not_equals">لا يساوي</option><option value="contains">يحتوي</option><option value="greater_than">أكبر من</option>
              </select>
              <input className="input w-28" placeholder="القيمة" value={r.value} onChange={(e) => setRules((x) => x.map((y, j) => j === i ? { ...y, value: e.target.value } : y))} />
              <input className="input w-24" dir="ltr" type="number" placeholder="+سعر" value={r.price_delta} onChange={(e) => setRules((x) => x.map((y, j) => j === i ? { ...y, price_delta: Number(e.target.value) } : y))} />
              <button type="button" onClick={() => setRules((x) => x.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold text-ink-900">ماذا يشمل العرض</h2><button type="button" onClick={() => setIncluded((x) => [...x, { ...emptyIncluded }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> عنصر</button></div>
        {included.map((x, i) => (
          <div key={i} className="mb-2 rounded-xl border border-brand-100 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon name={x.icon} className="h-5 w-5" /></span>
              <input className="input" placeholder="العربية" value={x.title_ar} onChange={(e) => setIncluded((a) => a.map((y, j) => j === i ? { ...y, title_ar: e.target.value } : y))} />
              <input className="input" dir="ltr" placeholder="English" value={x.title_en} onChange={(e) => setIncluded((a) => a.map((y, j) => j === i ? { ...y, title_en: e.target.value } : y))} />
              <button type="button" onClick={() => setIncluded((a) => a.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
            <IconPicker value={x.icon} onChange={(name) => setIncluded((a) => a.map((y, j) => j === i ? { ...y, icon: name } : y))} />
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold text-ink-900">مراحل العمل</h2><button type="button" onClick={() => setStages((x) => [...x, { ...emptyStage }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> مرحلة</button></div>
        {stages.map((s, i) => (
          <div key={i} className="mb-2 grid gap-2 rounded-xl border border-brand-100 p-3 sm:grid-cols-3">
            <input className="input" placeholder="العنوان (عربي)" value={s.title_ar} onChange={(e) => setStages((x) => x.map((y, j) => j === i ? { ...y, title_ar: e.target.value } : y))} />
            <input className="input" dir="ltr" placeholder="Title (EN)" value={s.title_en} onChange={(e) => setStages((x) => x.map((y, j) => j === i ? { ...y, title_en: e.target.value } : y))} />
            <div className="flex items-center gap-2">
              <input className="input" placeholder="مدة" value={s.duration} onChange={(e) => setStages((x) => x.map((y, j) => j === i ? { ...y, duration: e.target.value } : y))} />
              <button type="button" onClick={() => setStages((x) => x.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink-900">الأزرار</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نص زر الطلب (عربي)"><input className="input" value={form.cta_text_ar} onChange={(e) => update("cta_text_ar", e.target.value)} /></Field>
          <Field label="نص زر الطلب (EN)"><input className="input" dir="ltr" value={form.cta_text_en} onChange={(e) => update("cta_text_en", e.target.value)} /></Field>
          <Field label="نص زر المحادثة (عربي)"><input className="input" value={form.chat_text_ar} onChange={(e) => update("chat_text_ar", e.target.value)} /></Field>
          <Field label="نص زر المحادثة (EN)"><input className="input" dir="ltr" value={form.chat_text_en} onChange={(e) => update("chat_text_en", e.target.value)} /></Field>
        </div>
      </div>

      {isEdit && offerId && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-ink-900">SEO</h2>
          <SeoFields entityType="offer" entityId={offerId} />
        </div>
      )}
    </div>
  );
}
