"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import { FolderGit2, TerminalSquare, ArrowRight, ArrowLeft } from "lucide-react";
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

export function AboutCodeSection({ data, locale }: { data: AboutCodeSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const tabs = data.tabs ?? ["architecture.ts", "database.sql", "api.ts"];
  const [activeTab, setActiveTab] = useState(0);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const { ref, visibleLines, done } = useCodeReveal(CODE.length, 55);

  return (
    <section className="container-site py-16 sm:py-20">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text side */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <FolderGit2 className="h-3.5 w-3.5" />
            {isAr ? "من الفكرة إلى كود يعمل" : "From Idea to Working Code"}
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">{title}</h2>
          <p className="mt-4 leading-relaxed text-gray-600">{desc}</p>
        </Reveal>

        {/* Architecture code editor */}
        <Reveal delay={120}>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-brand-gradient opacity-10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0c1c] shadow-soft">
              {/* file tree + tabs header (architecture-style) */}
              <div className="border-b border-white/10">
                <div className="flex items-center gap-1.5 px-4 pt-3">
                  {tabs.map((tb, i) => (
                    <button
                      key={tb}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={`rounded-t-lg border-b-2 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                        activeTab === i ? "border-brand-400 bg-white/5 text-white" : "border-transparent text-white/40 hover:text-white/70"
                      }`}
                      dir="ltr"
                    >
                      {tb}
                    </button>
                  ))}
                </div>
              </div>

              {/* code body */}
              <div ref={ref} className="h-[440px] overflow-hidden p-5 font-mono text-[13px] leading-[1.7] lg:h-[520px]" dir="ltr">
                {CODE.map((line, i) => (
                  <CodeLine key={i} index={i} tokens={line} visible={visibleLines > i} caret={done && i === CODE.length - 1} tokenClass={TOKEN_CLASS} />
                ))}
              </div>

              {/* status bar */}
              <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-white/40">
                <span className="inline-flex items-center gap-1.5">
                  <TerminalSquare className="h-3.5 w-3.5" />
                  ts-node · SITEKOOM_CORE
                </span>
                <span dir="ltr">UTF-8 · TypeScript</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* CTA */}
      <Reveal delay={60}>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={localizePath("/request-project", locale)} className="btn-primary px-8 py-3 text-sm sm:text-base">
            {isAr ? "ابدأ مشروعك" : "Start Your Project"}
            <Arrow className="h-4 w-4" />
          </Link>
          <Link href={localizePath("/contact", locale)} className="btn-secondary px-8 py-3 text-sm sm:text-base">
            {isAr ? "اتصل بنا" : "Contact Us"}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
