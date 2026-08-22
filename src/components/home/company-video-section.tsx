import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localize } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { SocialIcons } from "@/components/social-icons";
import type { CompanyInfo, SocialLink } from "@/lib/types";

export function CompanyVideoSection({
  locale,
  company,
  social,
  dict,
}: {
  locale: Locale;
  company: CompanyInfo;
  social: SocialLink[];
  dict: Dictionary;
}) {
  const p = (path: string) => localizePath(path, locale);
  const videoUrl = company?.video_url ?? "";

  const title = localize(locale, company?.video_title_ar, company?.video_title_en);
  const intro = localize(locale, company?.video_intro_ar, company?.video_intro_en);

  return (
    <section className="container-site py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          {title && <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>}
          {intro && <p className="mt-4 text-lg text-gray-600">{intro}</p>}
        </Reveal>

        {videoUrl && (
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-ink-900 p-1.5 shadow-glow transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(122,26,255,0.35)]">
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <video
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-cover"
                />
              </div>
            </div>
          </Reveal>
        )}

        {social.length > 0 && (
          <Reveal className="mt-8">
            <div className="flex flex-wrap justify-center gap-2">
              <SocialIcons social={social} showLabel />
            </div>
          </Reveal>
        )}

        <Reveal className="mt-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={p("/contact")} className="btn-primary px-6 py-3">
              {dict.home.contactUs}
            </Link>
            <Link href={p("/request-project")} className="btn-secondary px-6 py-3">
              {dict.home.requestProjectNow}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
