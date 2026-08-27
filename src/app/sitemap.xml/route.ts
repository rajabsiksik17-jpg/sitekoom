import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";
  const supabase = createClient();

  const [services, projects, articles, offers, achievements] = await Promise.all([
    supabase.from("services").select("slug,updated_at").eq("status", "published").is("deleted_at", null),
    supabase.from("projects").select("slug,updated_at").eq("status_field", "published").is("deleted_at", null),
    supabase.from("articles").select("slug,updated_at").eq("status", "published").is("deleted_at", null),
    supabase.from("offers").select("slug,updated_at").eq("status", "published").is("deleted_at", null),
    supabase.from("achievements").select("slug,updated_at").eq("status_field", "published").is("deleted_at", null),
  ]);

  const staticPages = ["", "/about", "/services", "/offers", "/achievements", "/projects", "/blog", "/request-project", "/contact", "/privacy", "/terms"];

  const urls: string[] = [];

  for (const page of staticPages) {
    urls.push(`<url><loc>${siteUrl}${page === "" ? "/" : page}</loc></url>`);
    urls.push(`<url><loc>${siteUrl}/en${page === "" ? "" : page}</loc></url>`);
  }

  for (const s of services.data ?? []) {
    urls.push(`<url><loc>${siteUrl}/services/${s.slug}</loc><lastmod>${s.updated_at?.slice(0, 10) ?? ""}</lastmod></url>`);
    urls.push(`<url><loc>${siteUrl}/en/services/${s.slug}</loc></url>`);
  }
  for (const p of projects.data ?? []) {
    urls.push(`<url><loc>${siteUrl}/projects/${p.slug}</loc><lastmod>${p.updated_at?.slice(0, 10) ?? ""}</lastmod></url>`);
    urls.push(`<url><loc>${siteUrl}/en/projects/${p.slug}</loc></url>`);
  }
  for (const a of articles.data ?? []) {
    urls.push(`<url><loc>${siteUrl}/blog/${a.slug}</loc><lastmod>${a.updated_at?.slice(0, 10) ?? ""}</lastmod></url>`);
    urls.push(`<url><loc>${siteUrl}/en/blog/${a.slug}</loc></url>`);
  }
  for (const o of offers.data ?? []) {
    urls.push(`<url><loc>${siteUrl}/offers/${o.slug}</loc></url>`);
    urls.push(`<url><loc>${siteUrl}/en/offers/${o.slug}</loc></url>`);
  }
  for (const ac of achievements.data ?? []) {
    urls.push(`<url><loc>${siteUrl}/achievements/${ac.slug}</loc></url>`);
    urls.push(`<url><loc>${siteUrl}/en/achievements/${ac.slug}</loc></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
