"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { Spinner } from "@/components/admin/ui";
import type { DynamicForm, DynamicFormField, DynamicFormOption } from "@/lib/types";

const FIELD_TYPES = ["text", "textarea", "email", "phone", "number", "url", "date", "select", "multiselect", "radio", "checkbox", "checkbox_group", "switch", "file", "section", "description", "consent", "subject", "hidden"];

type FieldDraft = { id?: string; field_key: string; type: string; label_ar: string; label_en: string; placeholder_ar: string; placeholder_en: string; required: boolean; width: string; options: { id?: string; label_ar: string; label_en: string; value: string; price_delta: number }[] };
type RuleDraft = { field_key: string; condition_field_key: string; operator: string; value: string; action: string };

export function FormBuilder({ formId }: { formId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!formId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [rules, setRules] = useState<RuleDraft[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    key: "", placement: "custom", title_ar: "", title_en: "", description_ar: "", description_en: "",
    success_message_ar: "", success_message_en: "", is_active: true,
  });

  useEffect(() => {
    if (!formId) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("dynamic_forms").select("*").eq("id", formId).single(),
      supabase.from("dynamic_form_fields").select("*").eq("form_id", formId).order("sort"),
    ]).then(([f, fl]) => {
      if (f.data) {
        const d = f.data as DynamicForm;
        setForm({ key: d.key, placement: d.placement ?? "custom", title_ar: d.title_ar, title_en: d.title_en, description_ar: d.description_ar ?? "", description_en: d.description_en ?? "", success_message_ar: d.success_message_ar ?? "", success_message_en: d.success_message_en ?? "", is_active: d.is_active });
      }
      const fd = (fl.data ?? []) as DynamicFormField[];
      const supabase2 = createClient();
      if (fd.length) {
        supabase2.from("dynamic_form_options").select("*").in("field_id", fd.map((x) => x.id)).then(({ data: opts }) => {
          setFields(fd.map((x) => ({ id: x.id, field_key: x.field_key, type: x.type, label_ar: x.label_ar, label_en: x.label_en, placeholder_ar: x.placeholder_ar ?? "", placeholder_en: x.placeholder_en ?? "", required: x.required, width: x.width, options: (opts ?? []).filter((o: DynamicFormOption) => o.field_id === x.id).map((o: DynamicFormOption) => ({ id: o.id, label_ar: o.label_ar, label_en: o.label_en, value: o.value, price_delta: Number(o.price_delta) })) })));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [formId]);

  useEffect(() => {
    if (!formId) return;
    const supabase = createClient();
    supabase.from("dynamic_form_rules").select("*").eq("form_id", formId).then(({ data }) => {
      supabase.from("dynamic_form_fields").select("id,field_key").eq("form_id", formId).then(({ data: fl }) => {
        const map = new Map((fl ?? []).map((f: { id: string; field_key: string }) => [f.id, f.field_key]));
        setRules((data ?? []).map((r: { field_id: string | null; condition_field_id: string | null; operator: string; value: string; action: string }) => ({ field_key: r.field_id ? (map.get(r.field_id) ?? "") : "", condition_field_key: r.condition_field_id ? (map.get(r.condition_field_id) ?? "") : "", operator: r.operator, value: r.value, action: r.action })));
      });
    });
  }, [formId]);

  function update(field: string, value: unknown) { setForm((f) => ({ ...f, [field]: value })); }

  function dropField(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  async function handleSave() {
    if (!form.key.trim()) return push("error", "أدخل مفتاح النموذج");
    setSaving(true);
    const supabase = createClient();
    const payload = { key: form.key.trim(), placement: form.placement, title_ar: form.title_ar, title_en: form.title_en, description_ar: form.description_ar || null, description_en: form.description_en || null, success_message_ar: form.success_message_ar || null, success_message_en: form.success_message_en || null, is_active: form.is_active };
    let id = formId;
    if (isEdit) {
      const { error } = await supabase.from("dynamic_forms").update(payload).eq("id", id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { data, error } = await supabase.from("dynamic_forms").insert(payload).select().single();
      if (error) { setSaving(false); return push("error", error.message); }
      id = data.id;
    }

    await supabase.from("dynamic_form_fields").delete().eq("form_id", id);
    const keyToId = new Map<string, string>();
    for (const f of fields) {
      const { data: fld } = await supabase.from("dynamic_form_fields").insert({ form_id: id, field_key: f.field_key, type: f.type, label_ar: f.label_ar, label_en: f.label_en, placeholder_ar: f.placeholder_ar || null, placeholder_en: f.placeholder_en || null, required: f.required, width: f.width, sort: fields.indexOf(f) }).select().single();
      if (fld) {
        keyToId.set(f.field_key, fld.id);
        if (f.options.length) await supabase.from("dynamic_form_options").insert(f.options.map((o, i) => ({ field_id: fld.id, label_ar: o.label_ar, label_en: o.label_en, value: o.value, price_delta: o.price_delta, sort: i })));
      }
    }

    await supabase.from("dynamic_form_rules").delete().eq("form_id", id);
    if (rules.length) {
      await supabase.from("dynamic_form_rules").insert(rules.map((r, i) => ({ form_id: id, field_id: keyToId.get(r.field_key) ?? null, condition_field_id: keyToId.get(r.condition_field_key) ?? null, operator: r.operator, value: r.value, action: r.action, sort: i })));
    }

    setSaving(false);
    push("success", "تم حفظ النموذج");
    router.push("/admin/forms");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const supportsOptions = (t: string) => ["select", "multiselect", "radio", "checkbox", "checkbox_group"].includes(t);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/forms" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink-900">إعدادات النموذج</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="مفتاح النموذج (Key)"><input className="input" dir="ltr" value={form.key} onChange={(e) => update("key", e.target.value)} /></Field>
          <Field label="مكان الاستخدام">
            <select className="input" value={form.placement} onChange={(e) => update("placement", e.target.value)}>
              <option value="custom">مخصص</option>
              <option value="contact">تواصل معنا</option>
              <option value="pricing_request">طلب التسعير</option>
              <option value="offer">العروض</option>
              <option value="live_chat">المحادثة المباشرة</option>
            </select>
          </Field>
          <Field label="عنوان النموذج (عربي)"><input className="input" value={form.title_ar} onChange={(e) => update("title_ar", e.target.value)} /></Field>
          <Field label="عنوان النموذج (EN)"><input className="input" dir="ltr" value={form.title_en} onChange={(e) => update("title_en", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رسالة النجاح (عربي)"><input className="input" value={form.success_message_ar} onChange={(e) => update("success_message_ar", e.target.value)} /></Field>
          <Field label="رسالة النجاح (EN)"><input className="input" dir="ltr" value={form.success_message_en} onChange={(e) => update("success_message_en", e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> مفعّل
        </label>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-ink-900">الحقول</h2><button type="button" onClick={() => setFields((x) => [...x, { field_key: `field_${x.length + 1}`, type: "text", label_ar: "", label_en: "", placeholder_ar: "", placeholder_en: "", required: false, width: "100", options: [] }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> حقل</button></div>
        {fields.map((f, fi) => (
          <div
            key={fi}
            draggable
            onDragStart={() => setDragIndex(fi)}
            onDragEnter={() => dragIndex !== null && dragIndex !== fi && dropField(fi)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            className={`mb-3 cursor-grab rounded-xl border border-brand-100 p-4 ${dragIndex === fi ? "border-brand-400 opacity-60" : ""}`}
          >
            <div className="grid gap-2 sm:grid-cols-4">
              <Field label="المفتاح"><input className="input" dir="ltr" value={f.field_key} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, field_key: e.target.value } : y))} /></Field>
              <Field label="النوع">
                <select className="input" value={f.type} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, type: e.target.value } : y))}>
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="العرض">
                <select className="input" value={f.width} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, width: e.target.value } : y))}>
                  <option value="100">100%</option><option value="50">50%</option><option value="33">33%</option><option value="25">25%</option>
                </select>
              </Field>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-1 pb-2 text-sm"><input type="checkbox" checked={f.required} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, required: e.target.checked } : y))} /> مطلوب</label>
                <button type="button" onClick={() => setFields((x) => x.filter((_, i) => i !== fi))} className="rounded p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Label (عربي)" value={f.label_ar} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, label_ar: e.target.value } : y))} />
              <input className="input" dir="ltr" placeholder="Label (EN)" value={f.label_en} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, label_en: e.target.value } : y))} />
            </div>
            {supportsOptions(f.type) && (
              <div className="mt-2">
                {f.options.map((o, oi) => (
                  <div key={oi} className="mb-1 flex items-center gap-2">
                    <input className="input" placeholder="عربي" value={o.label_ar} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, options: y.options.map((z, j) => j === oi ? { ...z, label_ar: e.target.value } : z) } : y))} />
                    <input className="input" dir="ltr" placeholder="EN" value={o.label_en} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, options: y.options.map((z, j) => j === oi ? { ...z, label_en: e.target.value } : z) } : y))} />
                    <input className="input w-24" dir="ltr" type="number" placeholder="+سعر" value={o.price_delta} onChange={(e) => setFields((x) => x.map((y, i) => i === fi ? { ...y, options: y.options.map((z, j) => j === oi ? { ...z, price_delta: Number(e.target.value) } : z) } : y))} />
                    <button type="button" onClick={() => setFields((x) => x.map((y, i) => i === fi ? { ...y, options: y.options.filter((_, j) => j !== oi) } : y))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setFields((x) => x.map((y, i) => i === fi ? { ...y, options: [...y.options, { label_ar: "", label_en: "", value: "", price_delta: 0 }] } : y))} className="text-xs font-semibold text-brand-600">+ خيار</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">القواعد الشرطية</h2>
          <button type="button" onClick={() => setRules((x) => [...x, { field_key: "", condition_field_key: "", operator: "equals", value: "", action: "show" }])} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-4 w-4" /> قاعدة</button>
        </div>
        {rules.length === 0 ? <p className="text-sm text-gray-400">لا توجد قواعد. أضف قاعدة لإظهار/إخفاء حقل بناءً على قيمة حقل آخر.</p> : (
          <div className="space-y-2">
            {rules.map((r, ri) => (
              <div key={ri} className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 p-3">
                <select className="input w-44" value={r.field_key} onChange={(e) => setRules((x) => x.map((y, i) => i === ri ? { ...y, field_key: e.target.value } : y))}>
                  <option value="">الحقل المستهدف</option>
                  {fields.map((f) => <option key={f.field_key} value={f.field_key}>{f.field_key}</option>)}
                </select>
                <select className="input w-32" value={r.action} onChange={(e) => setRules((x) => x.map((y, i) => i === ri ? { ...y, action: e.target.value } : y))}>
                  <option value="show">إظهار</option><option value="hide">إخفاء</option>
                </select>
                <span className="text-xs text-gray-500">عندما</span>
                <select className="input w-44" value={r.condition_field_key} onChange={(e) => setRules((x) => x.map((y, i) => i === ri ? { ...y, condition_field_key: e.target.value } : y))}>
                  <option value="">حقل الشرط</option>
                  {fields.map((f) => <option key={f.field_key} value={f.field_key}>{f.field_key}</option>)}
                </select>
                <select className="input w-32" value={r.operator} onChange={(e) => setRules((x) => x.map((y, i) => i === ri ? { ...y, operator: e.target.value } : y))}>
                  <option value="equals">يساوي</option><option value="not_equals">لا يساوي</option><option value="contains">يحتوي</option><option value="greater_than">أكبر من</option>
                </select>
                <input className="input w-32" value={r.value} onChange={(e) => setRules((x) => x.map((y, i) => i === ri ? { ...y, value: e.target.value } : y))} />
                <button type="button" onClick={() => setRules((x) => x.filter((_, i) => i !== ri))} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
