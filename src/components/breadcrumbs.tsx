import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { jsonLdToString, breadcrumbSchema } from "@/lib/seo";

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumbs({ items, locale }: { items: Crumb[]; locale: Locale }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const all = [{ name: locale === "ar" ? "الرئيسية" : "Home", path: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
        {all.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <Chevron className="h-4 w-4 text-gray-300" />}
            {i === all.length - 1 ? (
              <span aria-current="page" className="font-medium text-brand-700">
                {item.name}
              </span>
            ) : (
              <Link href={localizePath(item.path, locale)} className="hover:text-brand-700">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdToString(breadcrumbSchema(all, siteUrl)) }}
      />
    </nav>
  );
}
