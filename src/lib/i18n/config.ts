export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const localeDir: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

// "as-needed" prefixing: the default locale (ar) has no URL prefix, others do.
export function localizePath(pathname: string, locale: Locale): string {
  const path = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  if (locale === defaultLocale) return path || "/";
  return `/${locale}${path}`;
}
