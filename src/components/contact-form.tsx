"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/components/providers";
import { PhoneInput, type PhoneInputResult } from "@/components/phone-input";
import { isValidEmail } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

export interface ContactFormContext {
  serviceId?: string;
  serviceName?: string;
  source: string;
  sourcePage?: string;
  sourceRefId?: string;
  hideService?: boolean;
}

export function ContactForm({ context }: { context: ContactFormContext }) {
  const { locale, dict } = useLocale();
  const [form, setForm] = useState({ name: "", company: "", email: "", message: "", reason: "", otherReason: "" });
  const [phone, setPhone] = useState<PhoneInputResult>({ value: null, countryCode: "JO", nationalNumber: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const isOther = form.reason === dict.form.other || form.reason === "أخرى" || form.reason === "Other";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError(dict.common.required);
    if (!form.email.trim() || !isValidEmail(form.email)) return setError(dict.common.invalidEmail);
    if (!form.message.trim()) return setError(dict.common.required);
    if (phone.nationalNumber.trim() && !phone.value) return setError(dict.form.phoneInvalid);
    if (status === "loading") return;

    trackEvent({ event_type: "contact_form_started" });
    setStatus("loading");
    try {
      const reason = isOther && form.otherReason.trim() ? `${form.reason}: ${form.otherReason.trim()}` : form.reason;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          message: form.message,
          reason,
          phone: phone.value?.e164 ?? "",
          country: phone.value?.countryCode ?? "",
          phone_meta: phone.value,
          service_id: context.serviceId,
          service_name: context.serviceName,
          source: context.source,
          source_page: context.sourcePage ?? (typeof window !== "undefined" ? window.location.pathname : ""),
          source_ref_id: context.sourceRefId,
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="label">{dict.form.name} *</label>
          <input id="cf-name" className="input" placeholder={dict.form.namePlaceholder} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="cf-company" className="label">{dict.form.company}</label>
          <input id="cf-company" className="input" placeholder={dict.form.companyPlaceholder} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className="label">{dict.form.email} *</label>
          <input id="cf-email" type="email" className="input" placeholder={dict.form.emailPlaceholder} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <PhoneInput label={dict.form.phone} onChange={setPhone} />
      </div>

      <div>
        <label htmlFor="cf-reason" className="label">{dict.form.reason}</label>
        <select id="cf-reason" className="input" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}>
          <option value="">{dict.form.reasonPlaceholder}</option>
          {dict.form.reasons.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {isOther && (
        <div>
          <label htmlFor="cf-other" className="label">{dict.form.otherReason}</label>
          <input id="cf-other" className="input" value={form.otherReason} onChange={(e) => setForm((f) => ({ ...f, otherReason: e.target.value }))} />
        </div>
      )}

      <div>
        <label htmlFor="cf-message" className="label">{dict.form.message} *</label>
        <textarea id="cf-message" className="input min-h-[120px]" placeholder={dict.form.messagePlaceholder} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full px-6 py-3" disabled={status === "loading"}>
        {status === "loading" ? dict.common.sending : dict.common.send}
      </button>
    </form>
  );
}
