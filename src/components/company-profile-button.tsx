import Link from "next/link";
import { FileText } from "lucide-react";
import type { GeneralSettings } from "@/lib/settings";

export function CompanyProfileButton({ settings, locale }: { settings: GeneralSettings; locale: "ar" | "en" }) {
  const url = settings.company_profile_url;
  if (!url) return null;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm"
    >
      <FileText className="h-4 w-4 shrink-0" />
      {locale === "ar" ? "ملف الشركة" : "Company Profile"}
    </Link>
  );
}
