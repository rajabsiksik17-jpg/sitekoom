"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { FloatingContact } from "@/components/live-chat";
import { FloatingSocial } from "@/components/floating-social";
import { CookieConsent } from "@/components/cookie-consent";
import { PageViewTracker } from "@/components/page-view-tracker";
import type { GeneralSettings } from "@/lib/settings";
import type { Service, SocialLink } from "@/lib/types";

/**
 * Wraps a locale segment with the public marketing chrome (Header / Footer /
 * floating widgets). The client portal renders its OWN chrome, so the public
 * fixed header and floating support widget are omitted there — this keeps the
 * portal's header/sidebar from being overlapped and prevents the floating
 * support button from appearing inside the portal.
 */
export function SiteChrome({
  locale,
  settings,
  social,
  services,
  footer,
  children,
}: {
  locale: "ar" | "en";
  settings: GeneralSettings;
  social: SocialLink[];
  services: Service[];
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isClientArea = /(^|\/)client-portal(\/|$)/.test(pathname);

  const dir = locale === "ar" ? "rtl" : "ltr";

  if (isClientArea) {
    return <main dir={dir} className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header settings={settings} />
      <main dir={dir} className="min-h-screen">{children}</main>
      {footer}
      <FloatingContact settings={settings} />
      <FloatingSocial social={social} />
      <CookieConsent />
      <PageViewTracker />
    </>
  );
}
