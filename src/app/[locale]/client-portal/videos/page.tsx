import { getCurrentClient, getEducationalVideos } from "@/lib/client-data";
import { SectionTitle } from "@/components/client-portal/bits";
import { localize } from "@/lib/utils";

export const dynamic = "force-dynamic";

function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    if (u.pathname.startsWith("/embed/")) return url;
  } catch {
    /* ignore */
  }
  return url.includes("youtube.com/embed") ? url : null;
}

export default async function ClientVideosPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const videos = await getEducationalVideos(client.website_type);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("فيديوهات تعليمية", "Tutorial Videos")}</SectionTitle>

      {videos.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد فيديوهات تعليمية بعد.", "No tutorial videos yet.")}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {videos.map((v) => {
            const src = embedUrl(v.youtube_url);
            return (
              <div key={v.id} className="card overflow-hidden">
                {src ? (
                  <div className="aspect-video w-full bg-ink-900">
                    <iframe src={src} title={localize(locale, v.title_ar, v.title_en)} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-ink-900 text-white">{t("رابط الفيديو غير صالح", "Invalid video link")}</div>
                )}
                <div className="p-4">
                  <p className="font-bold text-ink-900">{localize(locale, v.title_ar, v.title_en)}</p>
                  {(v.description_ar || v.description_en) && <p className="mt-1 text-sm text-gray-500">{localize(locale, v.description_ar, v.description_en)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
