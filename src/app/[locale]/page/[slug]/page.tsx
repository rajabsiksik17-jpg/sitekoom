import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getPageBySlug } from "@/lib/queries";

export default async function CustomPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const dict = locale === "ar" ? ar : en;
  const page = await getPageBySlug((await params).slug);
  if (!page) notFound();

  const title = localize(locale, page.title_ar, page.title_en);
  const content = localize(locale, page.content_ar, page.content_en);

  return (
    <>
      <PageHero title={title} pageKey={`page-${page.slug}`} />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: title, path: `/page/${page.slug}` }]} />
        <div className="prose-site mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </>
  );
}
