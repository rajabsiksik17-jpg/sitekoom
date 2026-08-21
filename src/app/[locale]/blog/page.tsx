import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { localize, formatDate } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getArticles, getArticleCategories } from "@/lib/queries";

export default async function BlogPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const [articles, categories] = await Promise.all([getArticles(), getArticleCategories()]);

  return (
    <>
      <PageHero title={dict.blog.title} subtitle={dict.blog.subtitle} pageKey="blog" />
      <div className="container-site py-12">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/blog" className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white">
            {dict.common.all}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/blog?category=${c.slug}`}
              className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              {localize(locale, c.name_ar, c.name_en)}
            </Link>
          ))}
        </div>

        {articles.length === 0 ? (
          <p className="py-16 text-center text-gray-500">{dict.common.noResults}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <Reveal key={a.id} delay={i * 50}>
                <Link href={`/blog/${a.slug}`} className="card group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow">
                  <div className="aspect-[16/9] overflow-hidden bg-brand-50">
                    {a.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.cover_image} alt={localize(locale, a.title_ar, a.title_en)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-brand-gradient text-3xl font-bold text-white">
                        S
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    {a.category && (
                      <span className="text-xs font-semibold text-brand-600">
                        {localize(locale, a.category.name_ar, a.category.name_en)}
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-ink-900 group-hover:text-brand-700">
                      {localize(locale, a.title_ar, a.title_en)}
                    </h2>
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {localize(locale, a.excerpt_ar, a.excerpt_en)}
                    </p>
                    <span className="mt-auto pt-2 text-xs text-gray-400">
                      {formatDate(a.published_at, locale)}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
