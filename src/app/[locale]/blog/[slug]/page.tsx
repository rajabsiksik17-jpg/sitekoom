import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { localize, formatDate } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { localizePath } from "@/lib/i18n/config";
import { getArticleBySlug, getArticles } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { articleSchema, jsonLdToString } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: "ar" | "en"; slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  const supabase = createClient();
  const { data: seo } = await supabase
    .from("seo_metadata")
    .select("*")
    .eq("entity_type", "article")
    .eq("entity_id", article.id)
    .eq("locale", params.locale)
    .maybeSingle();
  const title = params.locale === "ar" ? article.title_ar : article.title_en;
  return {
    title: seo?.seo_title || title,
    description: seo?.meta_description || (params.locale === "ar" ? article.excerpt_ar : article.excerpt_en) || undefined,
    keywords: seo?.keywords,
    openGraph: {
      type: "article",
      title: seo?.og_title || title,
      description: seo?.og_description || undefined,
      images: (seo?.og_image || article.cover_image) ? [{ url: seo?.og_image || article.cover_image! }] : undefined,
      publishedTime: article.published_at ?? undefined,
    },
    alternates: { canonical: `/blog/${article.slug}` },
  };
}

export default async function ArticlePage({ params }: { params: { locale: "ar" | "en"; slug: string } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const p = (path: string) => localizePath(path, locale);

  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const title = localize(locale, article.title_ar, article.title_en);
  const content = localize(locale, article.content_ar, article.content_en);
  const excerpt = localize(locale, article.excerpt_ar, article.excerpt_en);
  const author = localize(locale, article.author?.name, article.author?.name);
  const category = localize(locale, article.category?.name_ar, article.category?.name_en);

  const all = await getArticles();
  const related = all.filter((a) => a.id !== article.id && a.category_id === article.category_id).slice(0, 3);
  const fallbackRelated = related.length ? related : all.filter((a) => a.id !== article.id).slice(0, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";

  return (
    <>
      <PageHero title={title} subtitle={excerpt} pageKey="article">
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/70">
          {author && (
            <span className="flex items-center gap-2">
              {article.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.author.avatar_url} alt={author} className="h-7 w-7 rounded-full" />
              ) : null}
              <span>{dict.blog.author}: {author}</span>
            </span>
          )}
          {category && <span>{dict.blog.category}: {category}</span>}
          <span>{dict.blog.publishedOn}: {formatDate(article.published_at, locale)}</span>
        </div>
      </PageHero>

      <div className="container-site py-12">
        <Breadcrumbs
          locale={locale}
          items={[
            { name: dict.nav.blog, path: "/blog" },
            { name: title, path: `/blog/${article.slug}` },
          ]}
        />

        <div className="mx-auto max-w-3xl">
          {article.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.cover_image} alt={title} className="mb-8 w-full rounded-2xl object-cover shadow-card" />
          )}
          {content && (
            <div className="prose-site" dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </div>

      {fallbackRelated.length > 0 && (
        <section className="bg-brand-50/40 py-16">
          <div className="container-site">
            <h2 className="mb-8 text-2xl font-extrabold text-ink-900">{dict.blog.related}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackRelated.map((a) => (
                <Reveal key={a.id}>
                  <Link href={p(`/blog/${a.slug}`)} className="card group block overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow">
                    <div className="aspect-[16/9] overflow-hidden bg-brand-50">
                      {a.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.cover_image} alt={localize(locale, a.title_ar, a.title_en)} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : null}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-ink-900 group-hover:text-brand-700">{localize(locale, a.title_ar, a.title_en)}</h3>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdToString(
            articleSchema({
              title,
              excerpt,
              image: article.cover_image ?? undefined,
              publishedAt: article.published_at ?? undefined,
              author: author || undefined,
              url: `${siteUrl}/blog/${article.slug}`,
            }),
          ),
        }}
      />
    </>
  );
}
