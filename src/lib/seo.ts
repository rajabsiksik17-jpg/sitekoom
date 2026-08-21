import type { GeneralSettings } from "@/lib/settings";

export function organizationSchema(settings: GeneralSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: settings.company_name_en,
    url: siteUrl,
    logo: settings.logo ? `${siteUrl}${settings.logo}` : undefined,
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address_en,
      addressLocality: "Amman",
      addressCountry: "JO",
    },
    sameAs: [],
  };
}

export function localBusinessSchema(settings: GeneralSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#localbusiness`,
    name: settings.company_name_en,
    url: siteUrl,
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address_en,
      addressLocality: "Amman",
      addressCountry: "JO",
    },
    openingHours: settings.working_hours_en || undefined,
    geo: {
      "@type": "GeoCoordinates",
      latitude: undefined,
      longitude: undefined,
    },
  };
}

export function websiteSchema(siteUrl: string, siteTitle: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteTitle,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function articleSchema(article: {
  title: string;
  excerpt?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.image ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    author: article.author ? { "@type": "Person", name: article.author } : undefined,
    mainEntityOfPage: article.url,
  };
}

export function serviceSchema(service: {
  name: string;
  description?: string | null;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description ?? undefined,
    provider: { "@type": "Organization", name: "Sitekoom" },
    serviceType: service.name,
    url: service.url,
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function jsonLdToString(schema: Record<string, unknown>): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
