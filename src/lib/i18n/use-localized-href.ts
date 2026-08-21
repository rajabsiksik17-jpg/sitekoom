"use client";

import { useLocale } from "@/components/providers";
import { localizePath } from "@/lib/i18n/config";

/**
 * Returns a function that prefixes a path with the current locale when needed
 * (English uses `/en`, Arabic uses no prefix). Use this for every internal link
 * so navigation never flips the language.
 */
export function useLocalizedHref() {
  const { locale } = useLocale();
  return (path: string) => localizePath(path, locale);
}
