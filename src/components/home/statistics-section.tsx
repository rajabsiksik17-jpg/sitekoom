import { Icon } from "@/components/icon";
import { Reveal } from "@/components/reveal";
import { CounterValue } from "@/components/home/counter";
import { localize } from "@/lib/utils";
import type { Statistic } from "@/lib/types";

export function StatisticsSection({
  locale,
  title,
  stats,
  data,
}: {
  locale: "ar" | "en";
  title: string;
  stats: Statistic[];
  data: Record<string, unknown>;
}) {
  const bgType = String(data.bg_type ?? "gradient");

  let bgStyle: React.CSSProperties = {};
  let bgImage: string | null = null;
  let imgOpacity = 1;

  if (bgType === "solid") {
    bgStyle = { backgroundColor: String(data.bg_color ?? "#7a1aff") };
  } else if (bgType === "image" && data.bg_image) {
    bgImage = String(data.bg_image);
    imgOpacity = Number(data.bg_image_opacity ?? 100) / 100;
  } else {
    const colors = (data.bg_colors as string[] | undefined) ?? ["#7a1aff", "#9d72ff"];
    const angle = Number(data.bg_angle ?? 135);
    bgStyle = { backgroundImage: `linear-gradient(${angle}deg, ${colors.join(", ")})` };
  }

  const overlayColor = String(data.bg_overlay_color ?? "");
  const overlayOpacity = Number(data.bg_overlay_opacity ?? 0) / 100;

  return (
    <section className="relative overflow-hidden py-16 text-white" style={bgStyle}>
      {bgImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: imgOpacity }} loading="lazy" />
      )}
      {overlayColor && overlayOpacity > 0 && (
        <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
      )}
      <div className="container-site relative">
        <h2 className="mb-10 text-center text-3xl font-extrabold">{title}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Reveal key={s.id} className="text-center">
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-white/25">
                <Icon name={s.icon} className="mx-auto mb-3 h-8 w-8 text-white/80" />
                <p className="text-4xl font-extrabold">
                  <CounterValue value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-sm text-white/80">{localize(locale, s.label_ar, s.label_en)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
