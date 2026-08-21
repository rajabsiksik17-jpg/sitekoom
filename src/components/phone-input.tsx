"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  detectCountry,
  findCountry,
  isValidPhone,
  normalizePhone,
  type PhoneValue,
} from "@/lib/phone";
import { useLocale } from "@/components/providers";

export interface PhoneInputResult {
  value: PhoneValue | null;
  countryCode: string;
  nationalNumber: string;
}

export function PhoneInput({
  label,
  onChange,
  initialCountry,
  initialNational,
  error,
  required,
}: {
  label?: string;
  onChange?: (result: PhoneInputResult) => void;
  initialCountry?: string;
  initialNational?: string;
  error?: string;
  required?: boolean;
}) {
  const { locale } = useLocale();
  const [countryCode, setCountryCode] = useState(initialCountry ?? "JO");
  const [national, setNational] = useState(initialNational ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialCountry && !initialNational) {
      setCountryCode(detectCountry());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const country = findCountry(countryCode);
  const valid = national.trim() === "" || isValidPhone(national, countryCode);

  useEffect(() => {
    if (onChange) {
      onChange({
        value: normalizePhone(national, countryCode),
        countryCode,
        nationalNumber: national,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, national]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameAr.includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase() === q,
    );
  }, [query]);

  const showError = touched && national.trim() !== "" && !valid;

  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        ref={rootRef}
        className={cn(
          "flex items-stretch rounded-xl border bg-white transition-colors",
          showError || error ? "border-red-300" : "border-brand-100 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200",
        )}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-full items-center gap-1.5 rounded-s-xl border-e border-brand-100 px-3 text-sm"
          >
            <span className="text-lg leading-none">{country.flag}</span>
            <span className="text-gray-700" dir="ltr">{country.dial}</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {open && (
            <div className="absolute start-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-card">
              <div className="border-b border-brand-100 p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    className="w-full rounded-lg bg-gray-50 py-2 ps-8 pe-2 text-sm outline-none"
                    placeholder="بحث..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setCountryCode(c.code);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-brand-50",
                        c.code === countryCode && "bg-brand-50",
                      )}
                    >
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span className="flex-1">{locale === "ar" ? c.nameAr : c.name}</span>
                      <span className="text-xs text-gray-400" dir="ltr">{c.dial}</span>
                      {c.code === countryCode && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <input
          dir="ltr"
          type="tel"
          inputMode="tel"
          className="flex-1 rounded-e-xl bg-transparent px-3 py-3 text-sm text-ink-900 outline-none placeholder:text-gray-400"
          placeholder="79 123 4567"
          value={national}
          onBlur={() => setTouched(true)}
          onChange={(e) => setNational(e.target.value.replace(/[^\d\s]/g, ""))}
        />
      </div>
      {(showError || error) && (
        <p className="mt-1 text-xs text-red-600">{error ?? "يرجى إدخال رقم هاتف صحيح للدولة المحددة."}</p>
      )}
    </div>
  );
}
