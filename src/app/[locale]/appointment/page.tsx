import { Mail, MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GoogleMapEmbed } from "@/components/google-map-embed";
import { CompanyVideoSection } from "@/components/home/company-video-section";
import { AppointmentForm } from "@/components/appointment-form";
import { localize, buildWhatsAppUrl } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getServices, getSocialLinks, getCompanyInfo } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getAppointmentSettings } from "@/lib/appointments";

export const metadata = { title: "Book an Appointment" };

export default async function AppointmentPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;

  const [services, social, company, settings, appointmentSettings] = await Promise.all([
    getServices(),
    getSocialLinks(),
    getCompanyInfo(),
    getSettings(),
    getAppointmentSettings(),
  ]);
  const g = settings.general;

  const info = [
    g.phone && { icon: Phone, label: dict.contact.phone, value: g.phone, href: `tel:${g.phone}` },
    g.whatsapp && { icon: MessageCircle, label: dict.contact.whatsapp, value: g.whatsapp, href: buildWhatsAppUrl(g.whatsapp) },
    g.email && { icon: Mail, label: dict.contact.email, value: g.email, href: `mailto:${g.email}` },
    { icon: MapPin, label: dict.contact.address, value: localize(locale, g.address_ar, g.address_en), href: g.google_maps_url },
    localize(locale, g.working_hours_ar, g.working_hours_en) && { icon: Clock, label: dict.contact.workingHours, value: localize(locale, g.working_hours_ar, g.working_hours_en), href: null },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string | null }[];

  return (
    <>
      <PageHero
        title={dict.nav.appointment}
        subtitle={locale === "ar" ? "احجز موعدًا مع فريقنا لاستشارة أو اجتماع أو مناقشة مشروعك." : "Book an appointment with our team for a consultation or meeting."}
        pageKey="appointment"
      />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: dict.nav.appointment, path: "/appointment" }]} />

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <GoogleMapEmbed
              embedUrl={g.google_maps_embed_url}
              linkUrl={g.google_maps_url}
              title={localize(locale, g.address_ar, g.address_en)}
              className="shadow-card"
            />
            <div className="space-y-3">
              {info.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="card card-hover flex items-start gap-4 p-4">
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
            </div>
          </div>

          <AppointmentForm services={services} settings={appointmentSettings} locale={locale} />
        </div>

        {company && company.video_url && (
          <div className="mt-16">
            <CompanyVideoSection locale={locale} company={company} social={social} dict={dict} />
          </div>
        )}
      </div>
    </>
  );
}
