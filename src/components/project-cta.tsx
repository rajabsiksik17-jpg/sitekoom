import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

import { localizePath, type Locale } from "@/lib/i18n/config";
import { localize, buildWhatsAppUrl } from "@/lib/utils";
import type { GeneralSettings } from "@/lib/settings";

interface ProjectCtaProps {
  locale: Locale;
  settings: GeneralSettings;
}

interface ContactItem {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  valueDirection: "ltr" | "rtl";
}

export function ProjectCta({
  locale,
  settings,
}: ProjectCtaProps) {
  const isAr = locale === "ar";

  const p = (path: string) => localizePath(path, locale);

  const Arrow = isAr ? ArrowLeft : ArrowRight;

  /*
   * Contact information
   *
   * The card itself follows the page direction,
   * while phone/email/WhatsApp values use LTR
   * to prevent incorrect digit/email ordering.
   */
  const contactItems: ContactItem[] = [
    settings.phone
      ? {
          icon: Phone,
          label: isAr ? "الهاتف" : "Phone",
          value: settings.phone,
          href: `tel:${settings.phone}`,
          valueDirection: "ltr",
        }
      : null,

    settings.whatsapp
      ? {
          icon: MessageCircle,
          label: "WhatsApp",
          value: settings.whatsapp,
          href: buildWhatsAppUrl(settings.whatsapp),
          valueDirection: "ltr",
        }
      : null,

    settings.email
      ? {
          icon: Mail,
          label: isAr ? "البريد الإلكتروني" : "Email",
          value: settings.email,
          href: `mailto:${settings.email}`,
          valueDirection: "ltr",
        }
      : null,

    settings.google_maps_url
      ? {
          icon: MapPin,
          label: isAr ? "الموقع" : "Location",
          value: localize(
            locale,
            settings.address_ar,
            settings.address_en
          ),
          href: settings.google_maps_url,
          valueDirection: isAr ? "rtl" : "ltr",
        }
      : null,
  ].filter((item): item is ContactItem => item !== null);

  return (
    <section
      className="container-site w-full min-w-0 py-8 sm:py-12 lg:py-16"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/*
       * IMPORTANT:
       * items-start prevents CSS Grid from stretching
       * both cards to the same height.
       *
       * Each card now has its own natural height.
       */}
      <div className="grid w-full min-w-0 items-start gap-4 sm:gap-6 lg:grid-cols-2 lg:items-start">

        {/* =====================================================
            PROJECT CTA
        ====================================================== */}
        <div
          className="
            relative
            h-fit
            min-w-0
            self-start
            overflow-hidden
            rounded-3xl
            bg-ink-900
            p-5
            text-white
            sm:p-8
            lg:p-10
          "
        >
          {/* Background */}
          <div
            className="pointer-events-none absolute inset-0 bg-hero-gradient"
            aria-hidden="true"
          />

          {/* Optional subtle overlay */}
          <div
            className="pointer-events-none absolute inset-0 bg-black/5"
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-fit min-w-0 flex-col">

            {/* Title */}
            <h2
              className={
                isAr
                  ? "max-w-xl text-lg font-extrabold leading-tight sm:text-2xl lg:text-3xl"
                  : "max-w-xl text-xl font-extrabold leading-tight sm:text-3xl lg:text-4xl"
              }
            >
              {isAr
                ? "لديك فكرة أو مشروع جديد؟"
                : "Have a project in mind?"}
            </h2>

            {/* Description */}
            <p
              className={
                isAr
                  ? "mt-2 max-w-xl text-[13px] leading-7 text-white/75 sm:mt-4 sm:text-[15px] sm:leading-7"
                  : "mt-2 max-w-xl text-sm leading-7 text-white/75 sm:mt-4 sm:text-base sm:leading-7"
              }
            >
              {isAr
                ? "حوّل فكرتك إلى حل رقمي احترافي مع Sitekoom. أخبرنا عن مشروعك وسنعمل معك على بناء الحل المناسب لاحتياجاتك."
                : "Turn your idea into a professional digital solution with Sitekoom. Tell us about your project and let's build the right solution for your business."}
            </p>

            {/* CTA Button */}
            <div className="mt-5 sm:mt-7">
              <Link
                href={p("/request-project")}
                className="
                  btn-primary
                  inline-flex
                  w-fit
                  max-w-full
                  items-center
                  justify-center
                  gap-2
                  whitespace-nowrap
                  px-5
                  py-2.5
                  text-sm
                  sm:px-8
                  sm:py-3.5
                "
              >
                <span>
                  {isAr
                    ? "ابدأ مشروعك الآن"
                    : "Start Your Project"}
                </span>

                <Arrow
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* =====================================================
            CONTACT CARD
        ====================================================== */}
        <div
          className="
            card
            h-fit
            min-w-0
            self-start
            w-full
            overflow-hidden
            p-5
            sm:p-7
            lg:p-8
          "
        >
          {/* Logo */}
          <div
            className="
              mb-3
              flex
              w-full
              items-center
              sm:mb-5
            "
          >
            {settings.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo}
                alt={
                  isAr
                    ? settings.company_name_ar
                    : settings.company_name_en
                }
                className="
                  h-9
                  w-auto
                  max-w-[140px]
                  object-contain
                  sm:h-12
                  sm:max-w-[180px]
                "
              />
            ) : (
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-brand-gradient
                  text-base
                  font-extrabold
                  text-white
                  sm:h-12
                  sm:w-12
                  sm:text-xl
                "
              >
                S
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={
              isAr
                ? "text-base font-extrabold leading-tight text-ink-900 sm:text-xl"
                : "text-lg font-extrabold leading-tight text-ink-900 sm:text-2xl"
            }
          >
            {isAr
              ? "نحن هنا لمساعدتك"
              : "We're Here to Help"}
          </h3>

          {/* Description */}
          <p
            className={
              isAr
                ? "mt-1.5 max-w-2xl text-[13px] leading-6 text-gray-600 sm:mt-2 sm:text-sm sm:leading-7"
                : "mt-1.5 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-2 sm:text-base sm:leading-7"
            }
          >
            {isAr
              ? "هل لديك استفسار أو تحتاج إلى معرفة المزيد عن خدماتنا؟ تواصل معنا وسيساعدك فريق Sitekoom في الوصول إلى الحل المناسب لمشروعك."
              : "Have a question or need more information about our services? Get in touch with the Sitekoom team and let's find the right solution for your project."}
          </p>

          {/* Contact Items */}
          <div
            className="
              mt-4
              w-full
              min-w-0
              space-y-2
              sm:mt-6
              sm:space-y-2.5
            "
          >
            {contactItems.map((item) => {
              const Icon = item.icon;

              const isExternal =
                item.href.startsWith("http://") ||
                item.href.startsWith("https://");

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={
                    isExternal
                      ? "noopener noreferrer"
                      : undefined
                  }
                  dir={isAr ? "rtl" : "ltr"}
                  className="
                    flex
                    min-w-0
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-brand-100
                    px-3
                    py-2.5
                    transition-all
                    duration-200
                    hover:border-brand-300
                    hover:bg-brand-50/50
                    sm:px-4
                    sm:py-3
                  "
                >
                  {/* Icon */}
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-brand-50
                      text-brand-700
                      sm:h-10
                      sm:w-10
                    "
                  >
                    <Icon
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      aria-hidden="true"
                    />
                  </span>

                  {/* Text */}
                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-semibold
                        leading-4
                        text-gray-400
                        sm:text-xs
                      "
                    >
                      {item.label}
                    </p>

                    <p
                      dir={item.valueDirection}
                      className={`
                        mt-0.5
                        min-w-0
                        truncate
                        text-[13px]
                        font-medium
                        leading-5
                        text-ink-900
                        ${
                          isAr
                            ? "text-right"
                            : "text-left"
                        }
                        sm:text-sm
                      `}
                    >
                      {item.value}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}