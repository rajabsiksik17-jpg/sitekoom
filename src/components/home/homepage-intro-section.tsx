"use client";

import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import { CheckCircle2, Braces, Layers, Zap, Boxes } from "lucide-react";
import type { IntroSection } from "@/lib/content-sections";

type Token = readonly [text: string, cls: string];

// A full, realistic-looking Sitekoom "engine" source file with syntax highlighting.
const CODE: Token[][] = [
  [["//", "tok-comment"], [" SITEKOOM_ENGINE", "tok-comment"], [" — digital solution blueprint", "tok-comment"]],
  [["const", "tok-keyword"], [" sitekoom", "tok-var"], [" = {", "tok-punct"]],
  [["  id", "tok-prop"], [":", "tok-punct"], [" \"sitekoom\",", "tok-string"]],
  [["  idea", "tok-prop"], [":", "tok-punct"], [" \"your brand\",", "tok-string"]],
  [["  strategy", "tok-prop"], [":", "tok-punct"], [" \"digital growth\",", "tok-string"]],
  [["  design", "tok-prop"], [":", "tok-punct"], [" \"exceptional experience\",", "tok-string"]],
  [["  stack", "tok-prop"], [":", "tok-punct"], [" [", "tok-punct"], ["\"design\"", "tok-string"], [", ", "tok-punct"], ["\"code\"", "tok-string"], [", ", "tok-punct"], ["\"performance\"", "tok-string"], ["],", "tok-punct"]],
  [["  ", "tok-comment"]],
  [["  build", "tok-prop"], [":", "tok-punct"], [" async ", "tok-keyword"], ["() => {", "tok-punct"]],
  [["    const", "tok-keyword"], [" solution", "tok-var"], [" = ", "tok-punct"], ["await", "tok-keyword"], [" understand", "tok-fn"], ["(project);", "tok-punct"]],
  [["    const", "tok-keyword"], [" experience", "tok-var"], [" = ", "tok-punct"], ["await", "tok-keyword"], [" design", "tok-fn"], ["(solution);", "tok-punct"]],
  [["    const", "tok-keyword"], [" product", "tok-var"], [" = ", "tok-punct"], ["await", "tok-keyword"], [" develop", "tok-fn"], ["(experience);", "tok-punct"]],
  [["    ", "tok-comment"]],
  [["    return", "tok-keyword"], [" optimize", "tok-fn"], ["(product);", "tok-punct"]],
  [["  },", "tok-punct"]],
  [["  ", "tok-comment"]],
  [["  scale", "tok-prop"], [": {", "tok-punct"]],
  [["    architecture", "tok-prop"], [":", "tok-punct"], [" \"scalable\",", "tok-string"]],
  [["    performance", "tok-prop"], [":", "tok-punct"], [" \"high\",", "tok-string"]],
  [["    experience", "tok-prop"], [":", "tok-punct"], [" \"user-first\"", "tok-string"]],
  [["  }", "tok-punct"]],
  [["};", "tok-punct"]],
];

const TOKEN_CLASS: Record<string, string> = {
  "tok-comment": "text-white/30 italic",
  "tok-keyword": "text-purple-300",
  "tok-var": "text-brand-300",
  "tok-fn": "text-cyan-300",
  "tok-prop": "text-sky-300",
  "tok-string": "text-green-300",
  "tok-punct": "text-white/45",
};

const PILLS_AR = ["مصمم من الصفر", "أداء عالٍ", "تقنيات حديثة", "بنية قابلة للتوسع"];
const PILLS_EN = ["Built From Scratch", "High Performance", "Modern Technology", "Scalable Architecture"];
// floating animation classes + staggered delays
const PILL_ANIM = ["pill-float-a", "pill-float-b", "pill-float-c", "pill-float-a"];

export function HomepageIntroSection({ data, locale }: { data: IntroSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const highlight = localize(locale, data.highlight_ar, data.highlight_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const points = (isAr ? data.points_ar : data.points_en) ?? [];
  const pills = isAr ? PILLS_AR : PILLS_EN;

  // Fallback descriptions if the DB value is still empty (graceful).
  const resolvedDesc =
    desc ||
    (isAr
      ? "في سايتكم لا نبني مواقع إلكترونية تقليدية، بل نصمم تجارب رقمية متكاملة تساعد الشركات والأعمال على بناء حضور قوي، الوصول إلى عملائها، وتحويل الأفكار إلى منتجات رقمية قابلة للنمو. نجمع بين التصميم الحديث، البرمجة المتقدمة، الأداء العالي، وتجربة المستخدم لنقدم حلولًا رقمية مصممة حول احتياجات كل مشروع."
      : "At Sitekoom we do not build ordinary websites. We design complete digital experiences that help businesses build a strong presence, reach their customers, and turn ideas into scalable digital products. We combine modern design, advanced engineering, high performance, and user experience to deliver digital solutions built around the needs of every project.");

  const resolvedPoints =
    points.length > 0
      ? points
      : isAr
        ? ["حلول مصممة من الصفر", "أداء وسرعة وتجربة مستخدم محسّنة", "تقنيات حديثة وقابلة للتوسع", "دعم وتطوير مستمر بعد الإطلاق"]
        : ["Solutions built from scratch", "Performance, speed and a refined experience", "Modern, scalable technology", "Continuous support after launch"];

  return (
    <section className="container-site py-16 sm:py-24">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text side */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <Braces className="h-3.5 w-3.5" />
            {isAr ? "حلول رقمية متكاملة" : "Complete digital solutions"}
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">{title}</h2>
          <p className="mt-4 text-lg font-bold text-brand-700">{highlight}</p>
          <p className="mt-4 leading-relaxed text-gray-600">{resolvedDesc}</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {resolvedPoints.map((pt) => (
              <li key={pt} className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
                {pt}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* VS Code visual */}
        <Reveal delay={120}>
          <div className="relative">
            {/* soft purple glow behind the editor */}
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-brand-gradient opacity-15 blur-3xl" aria-hidden="true" />

            {/* Floating pills */}
            <div className="relative z-10">
              {/* Code editor */}
              <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-ink-900/90 shadow-glow backdrop-blur-sm">
                {/* title bar */}
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400/90" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                  <span className="h-3 w-3 rounded-full bg-green-400/90" />
                  <span className="ms-2 truncate text-xs font-semibold tracking-wide text-white/60" dir="ltr">
                    SITEKOOM_ENGINE/digital_solution.ts
                  </span>
                </div>

                {/* code body */}
                <div className="h-[440px] overflow-hidden p-5 font-mono text-[13px] leading-[1.75] sm:h-[520px] lg:h-[560px]" dir="ltr" aria-label="Sitekoom engine code preview">
                  {CODE.map((line, i) => (
                    <div key={i} className="flex min-h-[1.75rem]">
                      <span className="w-8 shrink-0 select-none text-right text-white/20 pe-3">{i + 1}</span>
                      <span className="flex flex-1 flex-wrap gap-x-1 text-left">
                        {line.map(([text, cls], j) =>
                          text ? (
                            <span key={j} className={TOKEN_CLASS[cls] ?? "text-white/80"}>
                              {text}
                            </span>
                          ) : null,
                        )}
                        {i === 13 && <span className="caret ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand-300" aria-hidden="true" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating feature pills overlapping the bottom edge */}
              <div className="pointer-events-none absolute inset-x-4 -bottom-5 flex flex-wrap justify-center gap-2.5 sm:absolute sm:inset-x-6 sm:-bottom-5">
                {pills.map((p, i) => (
                  <span
                    key={p}
                    className={`${PILL_ANIM[i]} pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink-800/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-soft backdrop-blur-md transition-shadow duration-300 hover:border-brand-400/70 hover:shadow-glow`}
                    style={{ animationDuration: `${4.5 + i * 1.2}s`, animationDelay: `${i * 0.7}s` }}
                  >
                    {i === 0 ? <Boxes className="h-3 w-3 text-brand-300" /> : i === 1 ? <Zap className="h-3 w-3 text-brand-300" /> : i === 2 ? <Braces className="h-3 w-3 text-brand-300" /> : <Layers className="h-3 w-3 text-brand-300" />}
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* bottom spacer so pills don't clip into next section */}
            <div className="h-8" aria-hidden="true" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
