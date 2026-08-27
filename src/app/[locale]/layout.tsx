import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import { Footer } from "@/components/footer";
import { locales, type Locale } from "@/lib/i18n/config";
import { getSettings } from "@/lib/settings";
import { getServices, getSocialLinks, getOffers, getAchievements } from "@/lib/queries";
import { organizationSchema, localBusinessSchema, websiteSchema, jsonLdToString } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";
  return {
    title: {
      default: settings.seo.site_title,
      template: `%s | ${params.locale === "ar" ? settings.general.company_name_ar : settings.general.company_name_en}`,
    },
    description: settings.seo.meta_description,
    keywords: settings.seo.keywords.split(",").map((k) => k.trim()),
    icons: settings.general.favicon ? { icon: settings.general.favicon } : undefined,
    openGraph: {
      type: "website",
      locale: params.locale,
      siteName: params.locale === "ar" ? settings.general.company_name_ar : settings.general.company_name_en,
      images: settings.seo.default_og_image ? [{ url: settings.seo.default_og_image }] : undefined,
    },
    alternates: {
      canonical: "/",
      languages: {
        ar: "/",
        en: "/en",
      },
    },
    verification: settings.seo.google_verification
      ? { google: settings.seo.google_verification }
      : undefined,
    other: settings.seo.bing_verification
      ? { "msvalidate.01": settings.seo.bing_verification }
      : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  if (!locales.includes(params.locale)) notFound();

  const settings = await getSettings();
  const [social, services, offers, achievements] = await Promise.all([getSocialLinks(), getServices(), getOffers(), getAchievements()]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";
  const orgSchema = organizationSchema(settings.general, siteUrl, social);
  const localSchema = localBusinessSchema(settings.general, siteUrl);
  const webSchema = websiteSchema(siteUrl, settings.seo.site_title);

  return (
    <LocaleProvider locale={params.locale}>
      <SiteChrome
        locale={params.locale}
        settings={settings.general}
        social={social}
        services={services}
        hasOffers={offers.length > 0}
        hasAchievements={achievements.length > 0}
        footer={<Footer locale={params.locale} settings={settings.general} services={services} social={social} />}
      >
        {children}
      </SiteChrome>

      {settings.seo.analytics_id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.seo.analytics_id}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.seo.analytics_id}');`,
            }}
          />
        </>
      )}
      {settings.seo.gtm_id && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.seo.gtm_id}');`,
          }}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdToString(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdToString(localSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdToString(webSchema) }}
      />
    </LocaleProvider>
  );
}
