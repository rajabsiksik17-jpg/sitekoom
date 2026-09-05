"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import {
  FolderGit2,
  TerminalSquare,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useCodeReveal, CodeLine } from "@/components/code-reveal";
import { localizePath } from "@/lib/i18n/config";
import type { AboutCodeSection } from "@/lib/content-sections";

type Token = readonly [text: string, cls: string];

const CODE: Token[][] = [
  [["//", "tok-comment"], [" SITEKOOM_CORE", "tok-comment"], [" — architecture blueprint", "tok-comment"]],
  [["type", "tok-keyword"], [" DigitalProduct", "tok-type"], [" = {", "tok-punct"]],
  [["  idea", "tok-prop"], [":", "tok-punct"], [" Idea;", "tok-type"]],
  [["  architecture", "tok-prop"], [":", "tok-punct"], [" Architecture;", "tok-type"]],
  [["  experience", "tok-prop"], [":", "tok-punct"], [" Experience;", "tok-type"]],
  [["};", "tok-punct"]],
  [["", "tok-empty"]],
  [["async", "tok-keyword"], [" function", "tok-keyword"], [" buildProduct", "tok-fn"], ["(", "tok-punct"]],
  [["  project", "tok-prop"], [":", "tok-punct"], [" Project", "tok-type"]],
  [[")", "tok-punct"], [" {", "tok-punct"]],
  [["  const", "tok-keyword"], [" requirements", "tok-var"], [" =", "tok-punct"]],
  [["    ", "tok-punct"], ["await", "tok-keyword"], [" understand", "tok-fn"], ["(project);", "tok-punct"]],
  [["", "tok-empty"]],
  [["  const", "tok-keyword"], [" architecture", "tok-var"], [" =", "tok-punct"]],
  [["    ", "tok-punct"], ["designArchitecture", "tok-fn"], ["(requirements);", "tok-punct"]],
  [["", "tok-empty"]],
  [["  const", "tok-keyword"], [" system", "tok-var"], [" =", "tok-punct"]],
  [["    ", "tok-punct"], ["buildSystem", "tok-fn"], ["(architecture);", "tok-punct"]],
  [["", "tok-empty"]],
  [["  const", "tok-keyword"], [" experience", "tok-var"], [" =", "tok-punct"]],
  [["    ", "tok-punct"], ["createExperience", "tok-fn"], ["(system);", "tok-punct"]],
  [["", "tok-empty"]],
  [["  return", "tok-keyword"], [" optimize", "tok-fn"], ["({ system, experience });", "tok-punct"]],
  [["}", "tok-punct"]],
  [["", "tok-empty"]],
  [["const", "tok-keyword"], [" product", "tok-var"], [" =", "tok-punct"]],
  [["  ", "tok-punct"], ["await", "tok-keyword"], [" buildProduct", "tok-fn"], ["(clientProject);", "tok-punct"]],
];

const TOKEN_CLASS: Record<string, string> = {
  "tok-comment": "text-white/35 italic",
  "tok-keyword": "text-purple-300",
  "tok-type": "text-amber-300",
  "tok-var": "text-brand-300",
  "tok-fn": "text-cyan-300",
  "tok-prop": "text-sky-300",
  "tok-string": "text-green-300",
  "tok-punct": "text-white/50",
  "tok-empty": "",
};

export function AboutCodeSection({
  data,
  locale,
}: {
  data: AboutCodeSection;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";

  const title = localize(locale, data.title_ar, data.title_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);

  const tabs = data.tabs ?? [
    "architecture.ts",
    "database.sql",
    "api.ts",
  ];

  const [activeTab, setActiveTab] = useState(0);

  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const { ref, visibleLines, done } = useCodeReveal(
    CODE.length,
    55
  );

  return (
    <section className="container-site py-20 sm:py-24 lg:py-28">
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20"
      >
        {/* =====================================================
            TEXT SIDE
        ====================================================== */}
        <Reveal>
          <div className="max-w-2xl">
            {/* Section label */}
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/60 px-4 py-2 text-xs font-semibold text-brand-700 shadow-sm">
              <FolderGit2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isAr
                  ? "من الفكرة إلى كود يعمل"
                  : "From Idea to Working Code"}
              </span>
            </span>

            {/* Title */}
            <h2
              className="
                mt-5
                whitespace-nowrap
                text-[clamp(1.25rem,3.8vw,2.75rem)]
                font-extrabold
                leading-[1.15]
                tracking-tight
                text-ink-900
              "
            >
              {title}
            </h2>

            {/* Description */}
            <p
              className="
                mt-5
                max-w-2xl
                text-[15px]
                leading-8
                text-gray-600
                sm:text-base
                lg:text-[17px]
              "
            >
              {desc}
            </p>

            {/* CTA */}
            <div
              className="
                mt-8
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              <Link
                href={localizePath("/request-project", locale)}
                className="
                  btn-primary
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-6
                  py-3
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                "
              >
                <span>
                  {isAr ? "ابدأ مشروعك" : "Start Your Project"}
                </span>

                <Arrow className="h-4 w-4 shrink-0" />
              </Link>

              <Link
                href={localizePath("/contact", locale)}
                className="
                  btn-secondary
                  inline-flex
                  items-center
                  justify-center
                  px-6
                  py-3
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                "
              >
                {isAr ? "اتصل بنا" : "Contact Us"}
              </Link>
            </div>
          </div>
        </Reveal>

        {/* =====================================================
            CODE EDITOR SIDE
        ====================================================== */}
        <Reveal delay={120}>
          <div className="relative w-full min-w-0">
            {/* Soft background glow */}
            <div
              className="
                pointer-events-none
                absolute
                -inset-8
                rounded-[2.5rem]
                bg-brand-gradient
                opacity-[0.10]
                blur-3xl
              "
              aria-hidden="true"
            />

            {/* Editor */}
            <div
              className="
                relative
                w-full
                overflow-hidden
                rounded-[1.5rem]
                border
                border-white/10
                bg-[#0e0c1c]
                shadow-soft
                transition-all
                duration-500
                hover:-translate-y-1
                hover:shadow-[0_25px_80px_rgba(108,99,255,0.18)]
              "
            >
              {/* Tabs */}
              <div className="border-b border-white/10">
                <div className="flex items-center gap-1 overflow-x-auto px-3 pt-3 sm:px-4">
                  {tabs.map((tb, i) => (
                    <button
                      key={`${tb}-${i}`}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={`
                        shrink-0
                        rounded-t-lg
                        border-b-2
                        px-3
                        py-2
                        text-[10px]
                        font-medium
                        transition-all
                        duration-200
                        sm:text-[11px]
                        ${
                          activeTab === i
                            ? "border-brand-400 bg-white/5 text-white"
                            : "border-transparent text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                        }
                      `}
                      dir="ltr"
                    >
                      {tb}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code */}
              <div
                ref={ref}
                className="
                  h-[420px]
                  overflow-hidden
                  p-4
                  font-mono
                  text-[11px]
                  leading-[1.8]
                  sm:h-[480px]
                  sm:p-5
                  sm:text-[12px]
                  lg:h-[540px]
                  lg:text-[13px]
                "
                dir="ltr"
              >
                {CODE.map((line, i) => (
                  <CodeLine
                    key={i}
                    index={i}
                    tokens={line}
                    visible={visibleLines > i}
                    caret={
                      done && i === CODE.length - 1
                    }
                    tokenClass={TOKEN_CLASS}
                  />
                ))}
              </div>

              {/* Status bar */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  border-t
                  border-white/10
                  px-3
                  py-2
                  text-[9px]
                  text-white/40
                  sm:px-4
                  sm:text-[11px]
                "
              >
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <TerminalSquare className="h-3.5 w-3.5 shrink-0" />

                  <span className="truncate">
                    ts-node · SITEKOOM_CORE
                  </span>
                </span>

                <span
                  className="shrink-0"
                  dir="ltr"
                >
                  UTF-8 · TypeScript
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}