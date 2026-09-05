import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { ContactIntroSection, ContactProcessSection } from "@/lib/content-sections";

export function ContactIntro({ data, locale }: { data: ContactIntroSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const points = (isAr ? data.points_ar : data.points_en) ?? [];

  return (
    <section className="container-site py-16">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="card p-8 backdrop-blur-sm">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="text-3xl font-extrabold text-ink-900">{title}</h2>
            <p className="mt-4 leading-relaxed text-gray-600">{desc}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {points.map((pt) => (
                <li key={pt} className="flex items-center gap-2.5 rounded-xl border border-brand-100 bg-white/60 px-3 py-2.5 text-sm font-medium text-ink-800 backdrop-blur-sm transition-colors hover:border-brand-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-brand-gradient opacity-15 blur-2xl" />
            <div className="relative rounded-3xl border border-white/15 bg-ink-900 p-8 text-white backdrop-blur-sm">
              <p className="text-sm font-semibold text-brand-300">{isAr ? "Sitekoom" : "Sitekoom"}</p>
              <p className="mt-2 text-2xl font-extrabold leading-snug">{isAr ? "حل رقمي متكامل ينمو مع أعمالك" : "A complete digital solution that grows with you"}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {["Strategy", "Design", "Code", "Performance"].map((c) => (
                  <span key={c} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white/80">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ContactProcess({ data, locale }: { data: ContactProcessSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const steps = data.steps ?? [];

  return (
    <section className="container-site py-16">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal className="lg:order-2">
          <div className="card p-8">
            <h2 className="text-3xl font-extrabold text-ink-900">{title}</h2>
            <p className="mt-4 leading-relaxed text-gray-600">{desc}</p>
          </div>
        </Reveal>
        <Reveal delay={100} className="lg:order-1">
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="card card-hover flex items-center gap-4 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-extrabold text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-lg font-bold text-ink-900">{localize(locale, s.ar, s.en)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
