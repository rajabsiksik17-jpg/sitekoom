"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { localize } from "@/lib/utils";
import { PhoneInput } from "@/components/phone-input";
import type { Offer, OfferOptionGroup, OfferOptionValue, OfferAddon, OfferPackage, DynamicFormField, DynamicFormOption, DynamicFormRule } from "@/lib/types";

type PricingRule = { id: string; title_ar: string; title_en: string; condition: Record<string, unknown>; price_delta: number };
type FormConfig = { fields: DynamicFormField[]; options: DynamicFormOption[]; rules: DynamicFormRule[] } | null;

function evalCondition(op: string, a: string, b: string): boolean {
  if (op === "equals") return String(a) === String(b);
  if (op === "not_equals") return String(a) !== String(b);
  if (op === "contains") return String(a).includes(String(b));
  if (op === "greater_than") return Number(a) > Number(b);
  return false;
}

function getDeviceId(): string {
  const KEY = "sitekoom_device_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function OfferPricing({
  offer,
  optionGroups,
  optionValues,
  addons,
  packages,
  pricingRules,
  formConfig,
  locale,
}: {
  offer: Offer;
  optionGroups: OfferOptionGroup[];
  optionValues: OfferOptionValue[];
  addons: OfferAddon[];
  packages: OfferPackage[];
  pricingRules: PricingRule[];
  formConfig: FormConfig;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>(() => {
    const defaults: Record<string, string[]> = {};
    for (const g of optionGroups) {
      const def = optionValues.filter((v) => v.option_id === g.id && v.is_default).map((v) => v.id);
      defaults[g.id] = g.selection_type === "single" ? (def.length ? [def[0]] : []) : def;
    }
    return defaults;
  });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedFormOptionIds, setSelectedFormOptionIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const fields = formConfig?.fields ?? [];
  const rules = formConfig?.rules ?? [];
  const formOptions = formConfig?.options ?? [];

  const total = useMemo(() => {
    let sum = Number(offer.base_price) || 0;
    for (const id of Object.values(selectedValues).flat()) {
      const v = optionValues.find((x) => x.id === id);
      if (v) sum += Number(v.price_delta) || 0;
    }
    for (const id of selectedAddons) {
      const a = addons.find((x) => x.id === id);
      if (a) sum += Number(a.price) || 0;
    }
    if (selectedPackage) {
      const pkg = packages.find((x) => x.id === selectedPackage);
      if (pkg) sum += Number(pkg.price) || 0;
    }
    // Form field options with price delta.
    for (const id of selectedFormOptionIds) {
      const o = formOptions.find((x) => x.id === id);
      if (o) sum += Number(o.price_delta) || 0;
    }
    // Pricing rules (conditions evaluated against form field values).
    for (const r of pricingRules) {
      const cond = r.condition as { field_key?: string; operator?: string; value?: unknown };
      const val = fieldValues[cond.field_key ?? ""] ?? "";
      if (evalCondition(cond.operator ?? "equals", val, String(cond.value ?? ""))) {
        sum += Number(r.price_delta) || 0;
      }
    }
    return sum;
  }, [offer.base_price, selectedValues, selectedAddons, selectedPackage, selectedFormOptionIds, pricingRules, fieldValues, optionValues, addons, packages, formOptions]);

  function toggleValue(groupId: string, valueId: string, single: boolean) {
    setSelectedValues((prev) => {
      const current = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: [valueId] };
      return { ...prev, [groupId]: current.includes(valueId) ? current.filter((x) => x !== valueId) : [...current, valueId] };
    });
  }

  function setField(fieldKey: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));
  }

  function setFormOption(field: DynamicFormField, optionId: string, selected: boolean, single: boolean) {
    setSelectedFormOptionIds((prev) => {
      if (single) return prev.filter((id) => !formOptions.filter((o) => o.field_id === field.id).map((o) => o.id).includes(id)).concat(selected ? [optionId] : []);
      return selected ? [...prev, optionId] : prev.filter((id) => id !== optionId);
    });
    if (single) setField(field.field_key, optionId);
  }

  function isVisible(field: DynamicFormField): boolean {
    let visible = true;
    for (const r of rules) {
      if (r.field_id !== field.id) continue;
      const condField = fields.find((f) => f.id === r.condition_field_id);
      if (!condField) continue;
      if (evalCondition(r.operator, fieldValues[condField.field_key] ?? "", r.value)) {
        visible = r.action === "show";
      }
    }
    return visible;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return setError(t("يرجى إدخال الاسم والبريد", "Please enter your name and email"));
    for (const f of fields) {
      if (f.required && isVisible(f) && !["section", "description"].includes(f.type) && !(fieldValues[f.field_key] ?? "").trim()) {
        return setError(t(`يرجى تعبئة الحقل: ${f.label_ar}`, `Please fill the field: ${f.label_en}`));
      }
    }
    setSending(true);
    setError("");
    try {
      const values = fields.filter((f) => !["section", "description"].includes(f.type) && isVisible(f)).map((f) => ({ field_key: f.field_key, label: localize(locale, f.label_ar, f.label_en), value: fieldValues[f.field_key] ?? "" }));
      const subject = fieldValues["subject"] ?? "";
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-device-id": getDeviceId() },
        body: JSON.stringify({
          offer_id: offer.id,
          form_id: offer.form_id,
          name, email, phone, subject,
          language: locale,
          page_url: typeof window !== "undefined" ? window.location.pathname : "",
          selected_option_values: Object.values(selectedValues).flat(),
          selected_addons: selectedAddons,
          selected_packages: selectedPackage ? [selectedPackage] : [],
          selected_form_option_ids: selectedFormOptionIds,
          values,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-bold text-ink-900">{t("تم استلام طلبك بنجاح", "Your request has been received")}</p>
        <p className="mt-2 text-sm text-gray-600">{t("سيتواصل معك فريقنا قريبًا.", "Our team will contact you soon.")}</p>
      </div>
    );
  }

  function renderField(f: DynamicFormField) {
    const opts = formOptions.filter((o) => o.field_id === f.id);
    const single = ["select", "radio"].includes(f.type);
    const val = fieldValues[f.field_key] ?? "";

    switch (f.type) {
      case "textarea":
      case "subject":
        return <textarea className="input min-h-[80px] resize-y" dir={isAr ? "rtl" : "ltr"} placeholder={localize(locale, f.placeholder_ar, f.placeholder_en)} value={val} onChange={(e) => setField(f.field_key, e.target.value)} />;
      case "section":
        return <h4 className="font-bold text-ink-900">{localize(locale, f.label_ar, f.label_en)}</h4>;
      case "description":
        return <p className="text-sm text-gray-600">{localize(locale, f.label_ar, f.label_en)}</p>;
      case "select":
        return (
          <select className="input" value={val} onChange={(e) => { setField(f.field_key, e.target.value); setFormOption(f, e.target.value, true, true); }}>
            <option value="">—</option>
            {opts.map((o) => <option key={o.id} value={o.id}>{localize(locale, o.label_ar, o.label_en)}{Number(o.price_delta) > 0 ? ` (+${o.price_delta})` : ""}</option>)}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-1">
            {opts.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name={f.field_key} checked={selectedFormOptionIds.includes(o.id)} onChange={() => setFormOption(f, o.id, true, true)} className="text-brand-600" />
                {localize(locale, o.label_ar, o.label_en)}{Number(o.price_delta) > 0 ? ` (+${o.price_delta})` : ""}
              </label>
            ))}
          </div>
        );
      case "checkbox_group":
      case "multiselect":
        return (
          <div className="space-y-1">
            {opts.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedFormOptionIds.includes(o.id)} onChange={(e) => setFormOption(f, o.id, e.target.checked, false)} className="rounded border-brand-200 text-brand-600" />
                {localize(locale, o.label_ar, o.label_en)}{Number(o.price_delta) > 0 ? ` (+${o.price_delta})` : ""}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={val === "yes"} onChange={(e) => setField(f.field_key, e.target.checked ? "yes" : "")} className="rounded border-brand-200 text-brand-600" /> {localize(locale, f.label_ar, f.label_en)}</label>;
      default:
        return <input className="input" dir={f.type === "email" || f.type === "phone" || f.type === "number" || f.type === "url" || f.type === "date" ? "ltr" : isAr ? "rtl" : "ltr"} type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "email" ? "email" : "text"} placeholder={localize(locale, f.placeholder_ar, f.placeholder_en)} value={val} onChange={(e) => setField(f.field_key, e.target.value)} required={f.required} />;
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h3 className="text-xl font-extrabold text-ink-900">{t("احسب سعر العرض", "Calculate your price")}</h3>
        <div className="text-start">
          <span className="text-sm text-gray-500">{t("الإجمالي", "Total")}</span>
          <p className="text-2xl font-extrabold text-brand-700">{total} {offer.currency}</p>
        </div>
      </div>

      {optionGroups.map((g) => (
        <div key={g.id} className="mb-5">
          <p className="mb-2 font-semibold text-ink-900">{localize(locale, g.title_ar, g.title_en)}</p>
          <div className="space-y-2">
            {optionValues.filter((v) => v.option_id === g.id).map((v) => {
              const active = (selectedValues[g.id] ?? []).includes(v.id);
              return (
                <button key={v.id} type="button" onClick={() => toggleValue(g.id, v.id, g.selection_type === "single")} className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors ${active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-brand-100 text-gray-600 hover:border-brand-300"}`}>
                  <span>{localize(locale, v.label_ar, v.label_en)}</span>
                  <span className="font-semibold">{Number(v.price_delta) > 0 ? `+${v.price_delta} ${offer.currency}` : "+0"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {addons.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 font-semibold text-ink-900">{t("الإضافات", "Add-ons")}</p>
          <div className="space-y-2">
            {addons.map((a) => (
              <label key={a.id} className="flex items-center justify-between rounded-xl border border-brand-100 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedAddons.includes(a.id)} onChange={() => setSelectedAddons((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]))} className="rounded border-brand-200 text-brand-600" />
                  {localize(locale, a.title_ar, a.title_en)}
                </span>
                <span className="font-semibold">+{Number(a.price)} {offer.currency}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 border-t border-brand-100 pt-5">
        <p className="font-bold text-ink-900">{t("اطلب العرض الآن", "Request this offer")}</p>
        <input className="input" dir={isAr ? "rtl" : "ltr"} placeholder={t("الاسم", "Name")} value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" dir="ltr" type="email" placeholder={t("البريد الإلكتروني", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PhoneInput label={t("الهاتف", "Phone")} onChange={(r) => setPhone(r.value?.e164 ?? "")} />

        {fields.filter(isVisible).map((f) => {
          const opts = formOptions.filter((o) => o.field_id === f.id);
          const required = f.required && !["section", "description"].includes(f.type);
          return (
            <div key={f.id} className="space-y-1">
              {f.type !== "section" && f.type !== "description" && f.type !== "checkbox" && (
                <label className="label">{localize(locale, f.label_ar, f.label_en)}{required && " *"}</label>
              )}
              {renderField(f)}
            </div>
          );
        })}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full px-6 py-3" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? t("جارٍ الإرسال...", "Sending...") : t(`إرسال الطلب (${total} ${offer.currency})`, `Submit request (${total} ${offer.currency})`)}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          const summary = [
            localize(locale, offer.title_ar, offer.title_en),
            fieldValues["subject"] ? `${t("الموضوع", "Subject")}: ${fieldValues["subject"]}` : "",
            t("السعر التقديري", "Estimated price") + `: ${total} ${offer.currency}`,
          ].filter(Boolean).join("\n");
          window.dispatchEvent(new CustomEvent("sitekoom:chat", {
            detail: {
              offer_id: offer.id,
              offer_title: localize(locale, offer.title_ar, offer.title_en),
              offer_slug: offer.slug,
              name, email, phone,
              message: summary,
            },
          }));
        }}
        className="btn-secondary mt-3 flex w-full items-center justify-center gap-2 px-6 py-3"
      >
        <MessageCircle className="h-4 w-4" />
        {localize(locale, offer.chat_text_ar, offer.chat_text_en) || t("تحدث معنا", "Talk to us")}
      </button>
    </div>
  );
}
