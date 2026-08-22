import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localize } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { SocialIcons } from "@/components/social-icons";
import type { CompanyInfo, SocialLink } from "@/lib/types";

const FALLBACK_TITLE_AR = "نحوّل الأفكار إلى حلول رقمية تصنع الفرق";
const FALLBACK_TITLE_EN = "Turning Ideas Into Digital Solutions That Make a Difference";
const FALLBACK_INTRO_AR =
  "في Sitekoom لا نكتفي ببناء موقع أو تطبيق، بل نصمم حلولًا رقمية متكاملة تساعد أعمالك على النمو، وتجمع بين التقنية والإبداع والتسويق في تجربة واحدة. من أول فكرة المشروع وحتى إطلاقه وتطويره، نعمل معك كشريك تقني وإبداعي يصنع قيمة حقيقية لأعمالك.";
const FALLBACK_INTRO_EN =
  "At Sitekoom we go beyond building websites and apps — we design complete digital solutions that help your business grow, bringing together technology, creativity and marketing in one experience. From the first idea through launch and growth, we work with you as a technology and creative partner that creates real value for your business.";

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
  const isAr = locale === "ar";
  const videoUrl = company?.video_url ?? "";

  const title = localize(locale, company?.video_title_ar, company?.video_title_en) || (isAr ? FALLBACK_TITLE_AR : FALLBACK_TITLE_EN);
  const intro = localize(locale, company?.video_intro_ar, company?.video_intro_en) || (isAr ? FALLBACK_INTRO_AR : FALLBACK_INTRO_EN);

  return (
    <section className="container-site py-20">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-10 lg:grid-cols-2">
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

        <div className="text-start">
          <Reveal>
            <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-5 leading-relaxed text-gray-600">{intro}</p>
          </Reveal>

          {social.length > 0 && (
            <Reveal delay={160}>
              <div className="mt-6 flex flex-wrap gap-2">
                <SocialIcons social={social} />
              </div>
            </Reveal>
          )}

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={p("/contact")} className="btn-primary px-6 py-3">
                {dict.home.contactUs}
              </Link>
              <Link href={p("/request-project")} className="btn-secondary px-6 py-3">
                {dict.home.requestProjectNow}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
