import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/reveal";
import { SocialIcons } from "@/components/social-icons";
import type { SocialLink } from "@/lib/types";

export function CompanyVideoSection({
  locale,
  videoUrl,
  social,
  dict,
}: {
  locale: Locale;
  videoUrl: string;
  social: SocialLink[];
  dict: Dictionary;
}) {
  const p = (path: string) => localizePath(path, locale);

  return (
    <section className="container-site py-20">
      <div className="mx-auto max-w-3xl text-center">
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
