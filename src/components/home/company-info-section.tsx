import Link from "next/link";
import { Phone, MapPin, Mail, Clock } from "lucide-react";
import { localizePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { GeneralSettings } from "@/lib/settings";
import { localize, buildWhatsAppUrl } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { GoogleMapEmbed } from "@/components/google-map-embed";
import { socialIcon } from "@/components/social-icons";
import type { SocialLink } from "@/lib/types";

export function CompanyInfoSection({
  locale,
  settings,
  social,
  dict,
  workingHours,
}: {
  locale: Locale;
  settings: GeneralSettings;
  social: SocialLink[];
  dict: Dictionary;
  workingHours?: string | null;
}) {
  const p = (path: string) => localizePath(path, locale);
  const companyName = locale === "ar" ? settings.company_name_ar : settings.company_name_en;
  const mapsUrl = settings.google_maps_url;
  const mapsEmbed = settings.google_maps_embed_url;
  const aboutLogoDesktop = settings.about_logo_width_desktop ?? 96;
  const aboutLogoLaptop = settings.about_logo_width_laptop ?? 84;
  const aboutLogoTablet = settings.about_logo_width_tablet ?? 72;
  const aboutLogoMobile = settings.about_logo_width_mobile ?? 64;

  return (
    <section className="mt-16">
      <style>{`:root{--about-logo-w:${aboutLogoDesktop}px}@media(max-width:1279px){:root{--about-logo-w:${aboutLogoLaptop}px}}@media(max-width:1023px){:root{--about-logo-w:${aboutLogoTablet}px}}@media(max-width:639px){:root{--about-logo-w:${aboutLogoMobile}px}}`}</style>
      <Reveal>
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="mb-6 flex items-center gap-4">
                {settings.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logo} alt={companyName} style={{ width: "var(--about-logo-w)", height: "auto" }} />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-extrabold text-white">
                    S
                  </span>
                )}
                <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{companyName}</h2>
              </div>

              <p className="leading-relaxed text-gray-600">
                {localize(locale, settings.tagline_ar, settings.tagline_en)}
              </p>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                {settings.phone && (
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Phone className="h-4 w-4" /></span>
                    <a href={`tel:${settings.phone}`} className="hover:text-brand-700" dir="ltr">{settings.phone}</a>
                  </li>
                )}
                {settings.email && (
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Mail className="h-4 w-4" /></span>
                    <a href={`mailto:${settings.email}`} className="hover:text-brand-700" dir="ltr">{settings.email}</a>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><MapPin className="h-4 w-4" /></span>
                  <span>{localize(locale, settings.address_ar, settings.address_en)}</span>
                </li>
                {workingHours && (
                  <li className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Clock className="h-4 w-4" /></span>
                    <span>{workingHours}</span>
                  </li>
                )}
              </ul>

              {social.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {social.map((s) => {
                    const Icon = socialIcon(s.platform);
                    return (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label ?? s.platform}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={p("/contact")} className="btn-primary px-6 py-3">{dict.home.contactUs}</Link>
                <Link href={p("/request-project")} className="btn-secondary px-6 py-3">{dict.home.requestProjectNow}</Link>
              </div>
            </div>

            {mapsUrl || mapsEmbed ? (
              <GoogleMapEmbed embedUrl={mapsEmbed} linkUrl={mapsUrl} title={dict.contact.map} className="h-full min-h-[260px]" />
            ) : null}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
