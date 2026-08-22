"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

export interface RenewalOption {
  type: "subscription" | "domain" | "hosting";
  name: string;
  amount: number;
}

export function RenewalForm({ options, locale }: { options: RenewalOption[]; locale: "ar" | "en" }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const isAr = locale === "ar";

  const typeLabel = (t: RenewalOption["type"]) =>
    ({ subscription: isAr ? "اشتراك" : "Subscription", domain: isAr ? "دومين" : "Domain", hosting: isAr ? "استضافة" : "Hosting" })[t];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    let service_type: RenewalOption["type"];
    let service_name: string;
    let finalAmount: number;

    if (selected === "__other") {
      if (!customName.trim()) return setError(isAr ? "أدخل اسم الخدمة" : "Enter a service name");
      service_type = "subscription";
      service_name = customName.trim();
      finalAmount = Number(amount) || 0;
    } else {
      const opt = options.find((o) => `${o.type}:${o.name}` === selected);
      if (!opt) return setError(isAr ? "اختر خدمة" : "Select a service");
      service_type = opt.type;
      service_name = opt.name;
      finalAmount = opt.amount;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/client/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type, service_name, amount: finalAmount, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setSuccess(true);
      setSelected("");
      setCustomName("");
      setMessage("");
      setAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        <RefreshCcw className="h-5 w-5 text-brand-600" />
        {isAr ? "طلب تجديد خدمة" : "Request a renewal"}
      </h3>

      {success && (
        <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
          {isAr ? "تم إرسال طلب التجديد بنجاح. سيتواصل معك فريق سايتكم قريبًا." : "Your renewal request was submitted. The Sitekoom team will contact you soon."}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="label">{isAr ? "الخدمة" : "Service"}</label>
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)} required>
            <option value="">{isAr ? "اختر خدمة..." : "Select a service..."}</option>
            {options.map((o) => (
              <option key={`${o.type}:${o.name}`} value={`${o.type}:${o.name}`}>
                {typeLabel(o.type)} — {o.name} ({Number(o.amount).toLocaleString()} {isAr ? "د.أ" : "JOD"})
              </option>
            ))}
            <option value="__other">{isAr ? "أخرى / غير مذكورة" : "Other / not listed"}</option>
          </select>
        </div>

        {selected === "__other" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{isAr ? "اسم الخدمة" : "Service name"}</label>
              <input className="input" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            </div>
            <div>
              <label className="label">{isAr ? "القيمة (اختياري)" : "Amount (optional)"}</label>
              <input className="input" dir="ltr" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label className="label">{isAr ? "ملاحظات إضافية" : "Additional notes"}</label>
          <textarea className="input min-h-[90px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={isAr ? "أي تفاصيل إضافية عن طلب التجديد..." : "Any additional details about your renewal request..."} />
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary px-6 py-2.5" disabled={loading}>
          {loading ? (isAr ? "جارٍ الإرسال..." : "Sending...") : isAr ? "إرسال الطلب" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
