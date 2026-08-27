import Link from "next/link";
import { localize } from "@/lib/utils";
import { localizePath } from "@/lib/i18n/config";
import type { Achievement } from "@/lib/types";

export function AchievementCard({ achievement, locale }: { achievement: Achievement; locale: "ar" | "en" }) {
  const p = (path: string) => localizePath(path, locale);
  const title = localize(locale, achievement.title_ar, achievement.title_en);
  const desc = localize(locale, achievement.short_desc_ar, achievement.short_desc_en);

  return (
    <Link href={p(`/achievements/${achievement.slug}`)} className="card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {achievement.main_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={achievement.main_image} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-brand-200">{title[0]}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {achievement.category && <span className="mb-2 text-xs font-semibold text-brand-600">{achievement.category}</span>}
        <h3 className="mb-2 font-bold text-ink-900">{title}</h3>
        {desc && <p className="line-clamp-2 text-sm text-gray-600">{desc}</p>}
      </div>
    </Link>
  );
}
