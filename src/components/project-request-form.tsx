"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Paperclip, X } from "lucide-react";
import { useLocale } from "@/components/providers";
import { PhoneInput, type PhoneInputResult } from "@/components/phone-input";
import { isValidEmail, localize } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import type { Service, ServiceCategory } from "@/lib/types";

interface Attachment {
  url: string;
  name: string;
  mime: string;
}

export function ProjectRequestForm({
  services,
  categories,
  initialServiceId,
}: {
  services: Service[];
  categories?: ServiceCategory[];
  initialServiceId?: string;
}) {
  const { locale, dict } = useLocale();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service_id: initialServiceId ?? "",
    category_id: "",
    otherService: "",
    projectDetails: "",
    budget: "",
    otherBudget: "",
    timeline: "",
  });
  const [phone, setPhone] = useState<PhoneInputResult>({ value: null, countryCode: "JO", nationalNumber: "" });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isOtherService = form.service_id === "__other__";
  const isOtherBudget = form.budget === dict.form.other || form.budget === "أخرى" || form.budget === "Other";

  function getUtm() {
    if (typeof window === "undefined") return {};
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source") ?? "",
      utm_medium: p.get("utm_medium") ?? "",
      utm_campaign: p.get("utm_campaign") ?? "",
      utm_term: p.get("utm_term") ?? "",
      utm_content: p.get("utm_content") ?? "",
    };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "فشل رفع الملف");
          continue;
        }
        setAttachments((prev) => [...prev, { url: data.url, name: data.name, mime: data.mime }]);
      } catch {
        setError(dict.form.error);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError(dict.common.required);
    if (!form.email.trim() || !isValidEmail(form.email)) return setError(dict.common.invalidEmail);
    if (!form.service_id) return setError(dict.quote.projectTypePlaceholder);
    if (isOtherService && !form.otherService.trim()) return setError(dict.quote.otherServicePlaceholder);
    if (!form.projectDetails.trim()) return setError(dict.common.required);
    if (phone.nationalNumber.trim() && !phone.value) return setError(dict.form.phoneInvalid);
    if (status === "loading") return;

    trackEvent({ event_type: "contact_form_started" });
    setStatus("loading");
    try {
      const selectedService = services.find((s) => s.id === form.service_id);
      const res = await fetch("/api/project-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: phone.value?.e164 ?? "",
          country: phone.value?.countryCode ?? "",
          phone_meta: phone.value,
          service_id: isOtherService ? null : form.service_id,
          service_name: isOtherService ? null : localize(locale, selectedService?.title_ar, selectedService?.title_en),
          other_service: isOtherService ? form.otherService : null,
          project_details: form.projectDetails,
          budget: form.budget,
          other_budget: isOtherBudget ? form.otherBudget : null,
          timeline: form.timeline,
          attachments: attachments.map((a) => a.url),
          source: "quote",
          source_page: typeof window !== "undefined" ? window.location.pathname : "",
          referrer: typeof document !== "undefined" ? document.referrer : "",
          locale,
          ...getUtm(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? dict.form.error);
      trackEvent({ event_type: "contact_form_submitted" });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : dict.form.error);
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <p className="text-lg font-semibold text-green-800">{dict.form.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h3 className="mb-4 font-bold text-ink-900">{dict.quote.personalInfo}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{dict.form.name} *</label>
            <input className="input" placeholder={dict.form.namePlaceholder} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">{dict.form.company}</label>
            <input className="input" placeholder={dict.form.companyPlaceholder} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <label className="label">{dict.form.email} *</label>
            <input type="email" className="input" placeholder={dict.form.emailPlaceholder} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <PhoneInput label={dict.form.phone} onChange={setPhone} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-bold text-ink-900">{dict.quote.projectType}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories && categories.length > 0 && (
            <div>
              <label className="label">{dict.quote.projectType} — التصنيف</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value, service_id: "" }))}>
                <option value="">{dict.quote.projectTypePlaceholder}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{localize(locale, c.name_ar, c.name_en)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">{dict.quote.projectType} *</label>
            <select className="input" value={form.service_id} onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}>
              <option value="">{dict.quote.projectTypePlaceholder}</option>
              {services
                .filter((s) => !form.category_id || s.category_id === form.category_id)
                .map((s) => (
                  <option key={s.id} value={s.id}>{localize(locale, s.title_ar, s.title_en)}</option>
                ))}
              <option value="__other__">{dict.form.other}</option>
            </select>
          </div>
          {isOtherService && (
            <div>
              <label className="label">{dict.quote.otherService} *</label>
              <input className="input" placeholder={dict.quote.otherServicePlaceholder} value={form.otherService} onChange={(e) => setForm((f) => ({ ...f, otherService: e.target.value }))} />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="label">{dict.quote.projectDetails} *</label>
        <textarea className="input min-h-[140px]" placeholder={dict.quote.projectDetailsPlaceholder} value={form.projectDetails} onChange={(e) => setForm((f) => ({ ...f, projectDetails: e.target.value }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{dict.quote.budget}</label>
          <select className="input" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}>
            <option value="">{dict.quote.budgetPlaceholder}</option>
            {dict.quote.budgets.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {isOtherBudget && (
            <input className="input mt-2" placeholder={dict.quote.otherBudget} value={form.otherBudget} onChange={(e) => setForm((f) => ({ ...f, otherBudget: e.target.value }))} />
          )}
        </div>
        <div>
          <label className="label">{dict.quote.timeline}</label>
          <select className="input" value={form.timeline} onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}>
            <option value="">{dict.quote.timelinePlaceholder}</option>
            {dict.quote.timelines.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">{dict.quote.attachments}</label>
        <p className="mb-2 text-xs text-gray-400">{dict.quote.attachmentsHint}</p>
        <input ref={fileRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,.zip" onChange={(e) => handleFiles(e.target.files)} />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary px-4 py-2.5 text-sm" disabled={uploading}>
          <Paperclip className="h-4 w-4" /> {uploading ? dict.common.loading : dict.quote.attachments}
        </button>
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {attachments.map((a, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 text-brand-600" />
                <span className="flex-1 truncate" dir="ltr">{a.name}</span>
                <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-red-500"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full px-6 py-3.5" disabled={status === "loading" || uploading}>
        {status === "loading" ? dict.quote.submitting : dict.quote.submit}
      </button>
    </form>
  );
}
