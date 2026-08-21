export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";
  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
