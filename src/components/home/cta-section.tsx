import Link from "next/link";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n/config";

export function CtaSection({
  locale,
  title,
  subtitle,
  ctaText,
  ctaHref,
  data,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  data: Record<string, unknown>;
}) {
  const bgType = String(data.bg_type ?? "gradient");
  const baseStyle: React.CSSProperties = {};
  let media: React.ReactNode = null;
  const objectPosition = String(data.bg_position ?? "center");
  const objectFit = String(data.bg_size ?? "cover") === "contain" ? "contain" : "cover";
  const mediaOpacity = Number(data.bg_media_opacity ?? 100) / 100;

  if (bgType === "solid") {
    baseStyle.backgroundColor = String(data.bg_color ?? "#0b0a1a");
  } else if (bgType === "image" && data.bg_image) {
    baseStyle.backgroundColor = "#0b0a1a";
    media = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={String(data.bg_image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full" style={{ objectFit, objectPosition, opacity: mediaOpacity }} />
    );
  } else if (bgType === "video" && data.bg_video) {
    baseStyle.backgroundColor = "#0b0a1a";
    media = (
      // eslint-disable-next-line @next/next/no-img-element
      <video src={String(data.bg_video)} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full" style={{ objectFit, objectPosition, opacity: mediaOpacity }} />
    );
  } else {
    const colors = (data.bg_colors as string[] | undefined) ?? ["#7a1aff", "#9d72ff"];
    const angle = Number(data.bg_angle ?? 135);
    baseStyle.backgroundImage = `linear-gradient(${angle}deg, ${colors.join(", ")})`;
  }

  const overlayColor = String(data.bg_overlay_color ?? "");
  const overlayOpacity = Number(data.bg_overlay_opacity ?? 0) / 100;

  return (
    <section className="container-site py-12 sm:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:py-16" style={baseStyle}>
          {media}
          {overlayColor && overlayOpacity > 0 && (
            <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
          )}
          <div className="relative">
            <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">{subtitle}</p>
            <Link href={ctaHref} className="btn-primary mt-8 px-8 py-3.5 text-base">
              {ctaText}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
