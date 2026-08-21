import { getPageHeroSettings } from "@/lib/queries";

export async function PageHero({
  title,
  subtitle,
  pageKey = "global",
  children,
}: {
  title: string;
  subtitle?: string;
  pageKey?: string;
  children?: React.ReactNode;
}) {
  const hero = await getPageHeroSettings(pageKey);

  const bg = hero?.background_gif ?? hero?.background_image ?? null;
  const mobileImage = hero?.mobile_image ?? null;
  const overlayColor = hero?.overlay_color ?? "#0b0a1a";
  const overlayOpacity = Number(hero?.overlay_opacity ?? 0.72);

  return (
    <section className="relative overflow-hidden bg-ink-900 pb-20 pt-36">
      {/* Background layer */}
      {bg ? (
        <picture className="absolute inset-0 h-full w-full">
          {mobileImage && <source media="(max-width: 640px)" srcSet={mobileImage} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="eager" />
        </picture>
      ) : (
        <div className="absolute inset-0 bg-hero-gradient" />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
      />

      <div className="container-site relative">
        <h1 className="max-w-3xl text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-white/70">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
