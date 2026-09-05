"use client";

import { useRef } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import { CheckCircle2, Braces, Layers, Zap, Boxes, ArrowRight, ArrowLeft } from "lucide-react";
import { useCodeReveal, CodeLine } from "@/components/code-reveal";
import { localizePath } from "@/lib/i18n/config";
import type { IntroSection } from "@/lib/content-sections";

type Token = readonly [text: string, cls: string];

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
  "tok-comment": "text-white/35 italic",
  "tok-keyword": "text-purple-300",
  "tok-var": "text-brand-300",
  "tok-fn": "text-cyan-300",
  "tok-prop": "text-sky-300",
  "tok-string": "text-green-300",
  "tok-punct": "text-white/50",
};

const PILLS_AR = ["مصمم من الصفر", "أداء عالٍ", "تقنيات حديثة", "بنية قابلة للتوسع"];
const PILLS_EN = ["Built From Scratch", "High Performance", "Modern Technology", "Scalable Architecture"];
const PILL_ANIM = ["pill-float-a", "pill-float-b", "pill-float-c", "pill-float-a"];
const PILL_ICONS = [Boxes, Zap, Braces, Layers];

export function HomepageIntroSection({ data, locale }: { data: IntroSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const title = localize(locale, data.title_ar, data.title_en);
  const highlight = localize(locale, data.highlight_ar, data.highlight_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const points = (isAr ? data.points_ar : data.points_en) ?? [];
  const pills = isAr ? PILLS_AR : PILLS_EN;

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

  const { ref, visibleLines, done } = useCodeReveal(CODE.length, 80);
  const editorRef = useRef<HTMLDivElement>(null);

  // subtle mouse-follow glow via CSS variables (only while pointer moves)
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = editorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

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

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localizePath("/request-project", locale)} className="btn-primary px-6 py-3">
              {isAr ? "ابدأ مشروعك" : "Start Your Project"}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link href={localizePath("/contact", locale)} className="btn-secondary px-6 py-3">
              {isAr ? "اتصل بنا" : "Contact Us"}
            </Link>
          </div>
        </Reveal>

        {/* VS Code visual */}
        <Reveal delay={120}>
          <div className="relative py-6 sm:py-10">
            {/* soft purple glow behind the editor */}
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-brand-gradient opacity-15 blur-3xl" aria-hidden="true" />

            {/* editor with hover glow following the pointer */}
            <div
              ref={editorRef}
              onPointerMove={onPointerMove}
              className="relative overflow-hidden rounded-2xl border border-white/12 bg-ink-900/90 shadow-glow backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:shadow-[0_0_50px_rgba(122,26,255,0.25)]"
            >
              {/* mouse-follow glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
                style={{ background: "radial-gradient(360px circle at var(--mx, 50%) var(--my, 40%), rgba(122,26,255,0.10), transparent 65%)" }}
                aria-hidden="true"
              />

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
              <div ref={ref} className="h-[440px] overflow-hidden p-5 font-mono text-[13px] leading-[1.75] sm:h-[520px] lg:h-[560px]" dir="ltr" aria-label="Sitekoom engine code preview">
                {CODE.map((line, i) => (
                  <CodeLine key={i} index={i} tokens={line} visible={visibleLines > i} caret={done && i === CODE.length - 1} tokenClass={TOKEN_CLASS} />
                ))}
              </div>
            </div>

            {/* Floating feature pills BELOW the editor */}
            <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:gap-3">
              {pills.map((p, i) => {
                const Icon = PILL_ICONS[i];
                return (
                  <span
                    key={p}
                    className={`${PILL_ANIM[i]} inline-flex items-center gap-1.5 rounded-full border border-brand-200/80 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-ink-900 shadow-soft backdrop-blur-md transition-all duration-300 hover:scale-[1.04] hover:border-brand-400 hover:shadow-glow`}
                    style={{ animationDuration: `${5.5 + i * 0.8}s`, animationDelay: `${i * 0.6}s` }}
                  >
                    <Icon className="h-3.5 w-3.5 text-brand-600" />
                    {p}
                  </span>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
