import Link from "next/link";
import { Phone, MessageCircle, Mail, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { localize, buildWhatsAppUrl } from "@/lib/utils";
import type { GeneralSettings } from "@/lib/settings";

export function ProjectCta({ locale, settings }: { locale: Locale; settings: GeneralSettings }) {
  const p = (path: string) => localizePath(path, locale);
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const contactItems = [
    settings.phone ? { icon: Phone, label: isAr ? "الهاتف" : "Phone", value: settings.phone, href: `tel:${settings.phone}` } : null,
    settings.whatsapp ? { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp, href: buildWhatsAppUrl(settings.whatsapp) } : null,
    settings.email ? { icon: Mail, label: isAr ? "البريد الإلكتروني" : "Email", value: settings.email, href: `mailto:${settings.email}` } : null,
    settings.google_maps_url ? { icon: MapPin, label: isAr ? "الموقع" : "Location", value: localize(locale, settings.address_ar, settings.address_en), href: settings.google_maps_url } : null,
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }[];

  return (
    <section className="container-site py-20">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-8 text-white sm:p-12">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold sm:text-4xl">{isAr ? "لديك فكرة أو مشروع جديد؟" : "Have a project in mind?"}</h2>
            <p className="mt-4 max-w-md text-white/70">
              {isAr
                ? "حوّل فكرتك إلى حل رقمي احترافي مع Sitekoom. أخبرنا عن مشروعك وسنعمل معك على بناء الحل المناسب لاحتياجاتك."
                : "Turn your idea into a professional digital solution with Sitekoom. Tell us about your project and let's build the right solution for your business."}
            </p>
            <Link href={p("/request-project")} className="btn-primary mt-8 px-8 py-3.5">
              {isAr ? "ابدأ مشروعك الآن" : "Start Your Project"}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="card p-8">
          <div className="mb-5 flex items-center gap-3">
            {settings.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo} alt={isAr ? settings.company_name_ar : settings.company_name_en} className="h-12 w-auto" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-xl font-extrabold text-white">S</span>
            )}
          </div>
          <h3 className="text-2xl font-extrabold text-ink-900">{isAr ? "نحن هنا لمساعدتك" : "We're Here to Help"}</h3>
          <p className="mt-2 text-gray-600">
            {isAr
              ? "هل لديك استفسار أو تحتاج إلى معرفة المزيد عن خدماتنا؟ تواصل معنا وسيساعدك فريق Sitekoom في الوصول إلى الحل المناسب لمشروعك."
              : "Have a question or need more information about our services? Get in touch with the Sitekoom team and let's find the right solution for your project."}
          </p>

          <div className="mt-6 space-y-2">
            {contactItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-brand-100 px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400">{item.label}</p>
                  <p className="truncate text-sm font-medium text-ink-900" dir="auto">{item.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
