import Link from "next/link";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/config";
import { ar, en, type Dictionary } from "@/lib/i18n/dictionaries";
import type { GeneralSettings } from "@/lib/settings";
import type { Service, SocialLink } from "@/lib/types";
import { localize, buildWhatsAppUrl } from "@/lib/utils";
import { SocialIcons } from "@/components/social-icons";

export function Footer({
  locale,
  settings,
  services,
  social,
}: {
  locale: Locale;
  settings: GeneralSettings;
  services: Service[];
  social: SocialLink[];
}) {
  const dict: Dictionary = locale === "ar" ? ar : en;
  const companyName = locale === "ar" ? settings.company_name_ar : settings.company_name_en;
  const year = new Date().getFullYear();
  const p = (path: string) => localizePath(path, locale);

  return (
    <footer className="bg-ink-900 text-white">
      <div className="container-site grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            {settings.footer_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.footer_logo} alt={companyName} className="h-10 w-auto" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white">
                S
              </span>
            )}
            {!settings.footer_logo && <span className="text-xl font-extrabold">{companyName}</span>}
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            {localize(locale, settings.tagline_ar, settings.tagline_en)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <SocialIcons social={social} showLabel />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/50">
            {dict.footer.quickLinks}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: dict.nav.home, href: "/" },
              { label: dict.nav.about, href: "/about" },
              { label: dict.nav.services, href: "/services" },
              { label: dict.nav.projects, href: "/projects" },
              { label: dict.nav.blog, href: "/blog" },
              { label: dict.nav.requestProject, href: "/request-project" },
              { label: dict.nav.contact, href: "/contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={p(l.href)} className="text-white/70 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/50">
            {dict.footer.services}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {services.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link
                  href={p(`/services/${s.slug}`)}
                  className="text-white/70 transition-colors hover:text-white"
                >
                  {localize(locale, s.title_ar, s.title_en)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/50">
            {dict.footer.contact}
          </h3>
          <ul className="space-y-3 text-sm text-white/70">
            {settings.phone && (
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-brand-300" />
                <a href={`tel:${settings.phone}`} className="hover:text-white">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.whatsapp && (
              <li className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-brand-300" />
                <a href={buildWhatsAppUrl(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {settings.whatsapp}
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-brand-300" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-brand-300" />
              <span>{localize(locale, settings.address_ar, settings.address_en)}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {year} {companyName}. {dict.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href={p("/privacy")} className="hover:text-white">
              {dict.footer.privacy}
            </Link>
            <Link href={p("/terms")} className="hover:text-white">
              {dict.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
