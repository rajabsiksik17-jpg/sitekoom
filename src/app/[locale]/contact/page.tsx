import { Mail, MapPin, Phone, Clock, MessageCircle, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { socialIcon } from "@/components/social-icons";
import { localize, buildWhatsAppUrl } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getSocialLinks } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export default async function ContactPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const [social, settings] = await Promise.all([getSocialLinks(), getSettings()]);
  const g = settings.general;

  const info = [
    g.phone && { icon: Phone, label: dict.contact.phone, value: g.phone, href: `tel:${g.phone}` },
    g.whatsapp && { icon: MessageCircle, label: dict.contact.whatsapp, value: g.whatsapp, href: buildWhatsAppUrl(g.whatsapp) },
    g.email && { icon: Mail, label: dict.contact.email, value: g.email, href: `mailto:${g.email}` },
    { icon: MapPin, label: dict.contact.address, value: localize(locale, g.address_ar, g.address_en), href: g.google_maps_url },
    localize(locale, g.working_hours_ar, g.working_hours_en) && {
      icon: Clock,
      label: dict.contact.workingHours,
      value: localize(locale, g.working_hours_ar, g.working_hours_en),
      href: null,
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string | null }[];

  return (
    <>
      <PageHero title={dict.contact.title} subtitle={dict.contact.subtitle} pageKey="contact" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: dict.nav.contact, path: "/contact" }]} />

        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {info.map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-white p-5 transition-colors hover:border-brand-300">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-400">{item.label}</p>
                    <p className="mt-0.5 font-medium text-ink-900">{item.value}</p>
                  </div>
                </div>
              );
              return item.href ? (
                <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block">
                  {content}
                </a>
              ) : (
                <div key={item.label}>{content}</div>
              );
            })}

            {social.length > 0 && (
              <div className="rounded-2xl border border-brand-100 bg-white p-5">
                <p className="mb-3 text-xs font-semibold text-gray-400">{dict.contact.followUs}</p>
                <div className="grid grid-cols-2 gap-2">
                  {social.map((s) => {
                    const Icon = socialIcon(s.platform);
                    return (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label ?? s.platform}
                        className="group flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2.5 transition-colors hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-900">
                            {s.label ?? s.platform}
                          </span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-brand-600" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="card p-8">
              <ContactForm context={{ source: "contact", sourcePage: "/contact" }} />
            </div>
          </div>
        </div>

        {g.google_maps_url && (
          <div className="mt-12 overflow-hidden rounded-2xl border border-brand-100">
            <iframe
              title={dict.contact.map}
              src={g.google_maps_url.includes("output=embed") ? g.google_maps_url : g.google_maps_url.replace("maps.google.com", "maps.google.com/maps") + "&output=embed"}
              className="h-[360px] w-full"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </>
  );
}
