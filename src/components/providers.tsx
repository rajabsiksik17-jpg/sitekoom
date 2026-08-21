"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/config";
import { ar, type Dictionary } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
  dir: "rtl" | "ltr";
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ar",
  dict: ar,
  dir: "rtl",
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider
      value={{ locale, dict: locale === "ar" ? ar : requireDict(locale), dir: locale === "ar" ? "rtl" : "ltr" }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

// static import to avoid dynamic require issues in client bundle
import { en } from "@/lib/i18n/dictionaries";
function requireDict(locale: Locale): Dictionary {
  return locale === "en" ? en : ar;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useDict() {
  return useContext(LocaleContext).dict;
}
