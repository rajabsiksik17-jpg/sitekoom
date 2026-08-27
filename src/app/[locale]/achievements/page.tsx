import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { AchievementCard } from "@/components/achievement-card";
import { getAchievements } from "@/lib/queries";

export default async function AchievementsPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const achievements = await getAchievements();

  return (
    <>
      <PageHero title={locale === "ar" ? "الإنجازات" : "Achievements"} subtitle={locale === "ar" ? "مشاريع وتجارب نفخر بها" : "Projects and experiences we are proud of"} pageKey="achievements" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: locale === "ar" ? "الإنجازات" : "Achievements", path: "/achievements" }]} />
        {achievements.length === 0 ? (
          <p className="py-16 text-center text-gray-500">{locale === "ar" ? "لا توجد إنجازات بعد." : "No achievements yet."}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a, i) => (
              <Reveal key={a.id} delay={i * 50}><AchievementCard achievement={a} locale={locale} /></Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
