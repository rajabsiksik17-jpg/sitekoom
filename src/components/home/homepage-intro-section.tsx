import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { IntroSection } from "@/lib/content-sections";

function CodeCard({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-brand-200 backdrop-blur-sm transition-all hover:border-brand-400/60 hover:text-white">
      {label}
    </span>
  );
}

export function HomepageIntroSection({ data, locale }: { data: IntroSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const highlight = localize(locale, data.highlight_ar, data.highlight_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const points = (isAr ? data.points_ar : data.points_en) ?? [];

  const codeLines = [
    ["const", "sitekoom", "=", "{"],
    ["  idea", ":", "'your brand',"],
    ["  stack", ":", "['design', 'code'],"],
    ["  build", ":", "async () => {"],
    ["    return", "await", "ship(idea, stack);"],
    ["  },"],
    ["};"],
  ];

  return (
    <section className="container-site py-20">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-10 lg:grid-cols-2">
        {/* Text side */}
        <Reveal>
          <h2 className="text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg font-bold text-brand-700">{highlight}</p>
          <p className="mt-4 leading-relaxed text-gray-600">{desc}</p>
          {points.length > 0 && (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {points.map((pt) => (
                <li key={pt} className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
                  {pt}
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* VS Code visual */}
        <Reveal delay={120}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-brand-gradient opacity-20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-ink-900 shadow-glow backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ms-2 truncate text-xs font-semibold text-white/60" dir="ltr">SITEKOOM_ENGINE/digital_solution.ts</span>
              </div>
              <div className="p-5 font-mono text-sm leading-7" dir="ltr">
                {codeLines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="w-6 shrink-0 text-right text-white/25 select-none">{i + 1}</span>
                    <span className="flex flex-wrap gap-x-2 text-start">
                      {line.map((tok, j) => (
                        <span key={j} className={tok.startsWith("'") ? "text-green-300" : /await|const|return/.test(tok) ? "text-purple-300" : /ship|build/.test(tok) ? "text-brand-300" : /[{}=>]/.test(tok) ? "text-white/50" : "text-white/80"}>{tok}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.cards.map((c) => <CodeCard key={c} label={c} />)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
