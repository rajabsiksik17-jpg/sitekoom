import { getCurrentClient, getEducationalVideos, getClientWebsites } from "@/lib/client-data";
import { SectionTitle } from "@/components/client-portal/bits";
import { YouTubePlayer } from "@/components/client-portal/youtube-player";
import { localize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientVideosPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const client = await getCurrentClient(locale);
  const websites = await getClientWebsites(client.id);
  const videos = await getEducationalVideos(client.id, websites.map((w) => w.id), client.website_type);
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div>
      <SectionTitle>{t("فيديوهات تعليمية", "Tutorial Videos")}</SectionTitle>

      {videos.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-500">{t("لا توجد فيديوهات تعليمية بعد.", "No tutorial videos yet.")}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {videos.map((v) => (
            <YouTubePlayer
              key={v.id}
              url={v.youtube_url}
              title={localize(locale, v.title_ar, v.title_en)}
              description={localize(locale, v.description_ar, v.description_en)}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
