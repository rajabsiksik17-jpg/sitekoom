import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface IntroSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  highlight_ar: string;
  highlight_en: string;
  desc_ar: string;
  desc_en: string;
  points_ar: string[];
  points_en: string[];
  cards: string[];
}

export interface ContactIntroSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  points_ar: string[];
  points_en: string[];
}

export interface ContactProcessStep {
  ar: string;
  en: string;
}

export interface ContactProcessSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  steps: ContactProcessStep[];
}

export interface AboutProcessStep {
  ar: { title: string; desc: string };
  en: { title: string; desc: string };
  icon: string;
}

export interface AboutProcessSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  steps: AboutProcessStep[];
}

export interface AboutPhilosophyItem {
  ar: { title: string; desc: string };
  en: { title: string; desc: string };
}

export interface AboutPhilosophySection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  highlight_ar: string;
  highlight_en: string;
  desc_ar: string;
  desc_en: string;
  items: AboutPhilosophyItem[];
}

export interface AboutCodeSection {
  enabled: boolean;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  filename: string;
  tabs: string[];
}

export interface ContentSections {
  homepage_intro: IntroSection;
  contact_intro: ContactIntroSection;
  contact_process: ContactProcessSection;
  about_process: AboutProcessSection;
  about_code: AboutCodeSection;
  about_technology: AboutPhilosophySection;
}

const defaults: ContentSections = {
  homepage_intro: {
    enabled: true,
    title_ar: "نصنع حضورك الرقمي، ونحوّل أفكارك إلى حلول",
    title_en: "We craft your digital presence and turn ideas into solutions",
    highlight_ar: "برمجة متطورة. تصميم استثنائي. نتائج حقيقية.",
    highlight_en: "Advanced code. Exceptional design. Real results.",
    desc_ar: "",
    desc_en: "",
    points_ar: [],
    points_en: [],
    cards: ["Scalable Architecture", "Modern Technology", "High Performance", "Built From Scratch"],
  },
  contact_intro: { enabled: true, title_ar: "", title_en: "", desc_ar: "", desc_en: "", points_ar: [], points_en: [] },
  contact_process: { enabled: true, title_ar: "", title_en: "", desc_ar: "", desc_en: "", steps: [] },
  about_process: {
    enabled: true,
    title_ar: "كيف نحوّل الفكرة إلى منتج رقمي؟",
    title_en: "How We Turn Ideas Into Digital Products",
    desc_ar: "كل مشروع ناجح يبدأ بفكرة واضحة، لكن تحويل الفكرة إلى منتج رقمي ناجح يحتاج إلى أكثر من مجرد كتابة الكود. في سايتكم نعمل على فهم الهدف، تحديد الاحتياج، بناء التجربة، ثم تطوير حل قابل للنمو والتوسع.",
    desc_en: "Every successful digital project starts with an idea. Turning that idea into a successful product requires more than writing code. At Sitekoom, we understand the goal, define the requirements, shape the experience, and build a solution designed to grow.",
    steps: [
      { ar: { title: "نفهم الفكرة", desc: "نبدأ بفهم أهداف المشروع، جمهوره، واحتياجاته الحقيقية." }, en: { title: "Understand the Idea", desc: "We start by understanding the project's goals, audience, and real needs." }, icon: "target" },
      { ar: { title: "نخطط الحل", desc: "نحوّل المتطلبات إلى هيكل واضح وتجربة مدروسة وقابلة للتنفيذ." }, en: { title: "Plan the Solution", desc: "We transform requirements into a clear structure and a scalable experience." }, icon: "layout-dashboard" },
      { ar: { title: "نبني التجربة", desc: "نجمع بين التصميم والبرمجة والأداء لبناء منتج رقمي متكامل." }, en: { title: "Build the Experience", desc: "We combine design, development, and performance to build a complete digital product." }, icon: "code" },
      { ar: { title: "نطوّر ونوسّع", desc: "نستمر في التحسين والتطوير حتى ينمو الحل مع نمو مشروعك." }, en: { title: "Improve & Scale", desc: "We continue optimizing and evolving the solution as your business grows." }, icon: "trending-up" },
    ],
  },
  about_technology: {
    enabled: true,
    title_ar: "التقنية وحدها لا تكفي",
    title_en: "Technology Alone Isn't Enough",
    highlight_ar: "نحن نبني الحل حول مشروعك.",
    highlight_en: "We Build Around Your Business.",
    desc_ar: "نؤمن أن أفضل الحلول الرقمية ليست الأكثر تعقيدًا، بل الأكثر ملاءمة للهدف. لذلك نبدأ من احتياجك، ونختار التقنية والتصميم والبنية التي تخدم مشروعك اليوم وتبقى قادرة على التطور غدًا.",
    desc_en: "We believe the best digital solutions are not the most complicated ones, but the ones that fit the goal. We start with your needs and choose the technology, design, and architecture that serve your business today and remain ready for tomorrow.",
    items: [
      { ar: { title: "فهم حقيقي", desc: "نفهم أهدافك قبل اختيار الحل." }, en: { title: "Real Understanding", desc: "We understand your goals before choosing the solution." } },
      { ar: { title: "تجربة مستخدم", desc: "نبني تجارب سهلة وواضحة وسريعة." }, en: { title: "User Experience", desc: "We build clear, fast, and intuitive experiences." } },
      { ar: { title: "تقنية مناسبة", desc: "نختار التقنية التي تخدم احتياج المشروع." }, en: { title: "Right Technology", desc: "We choose technology based on what your project actually needs." } },
      { ar: { title: "أداء واستقرار", desc: "نهتم بالسرعة والاستقرار وقابلية التوسع." }, en: { title: "Performance & Stability", desc: "We care about speed, stability, and scalability." } },
      { ar: { title: "تطوير مستمر", desc: "نبقى معك بعد الإطلاق للتحسين والنمو." }, en: { title: "Continuous Growth", desc: "We stay with you after launch to improve and grow the product." } },
    ],
  },
  about_code: {
    enabled: true,
    title_ar: "نحوّل التعقيد إلى تجربة بسيطة.",
    title_en: "We Turn Complexity Into Simplicity.",
    desc_ar: "خلف كل تجربة رقمية ناجحة، هناك بنية مدروسة وكود مكتوب ليعمل بكفاءة، لا ليبدو جيدًا فقط. في سايتكم نبني الحل من الداخل إلى الخارج، من منطق النظام والبيانات إلى الواجهة التي يتعامل معها المستخدم كل يوم.",
    desc_en: "Behind every successful digital experience is thoughtful architecture and code built to perform, not simply to look good. At Sitekoom, we build from the inside out — from system logic and data to the interface users interact with every day.",
    filename: "SITEKOOM_CORE/architecture.ts",
    tabs: ["architecture.ts", "database.sql", "api.ts"],
  },
};

export const getContentSections = cache(async (): Promise<ContentSections> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "content_sections").single();
  const raw = (data?.value ?? {}) as Partial<ContentSections>;
  return {
    homepage_intro: { ...defaults.homepage_intro, ...(raw.homepage_intro ?? {}) },
    contact_intro: { ...defaults.contact_intro, ...(raw.contact_intro ?? {}) },
    contact_process: { ...defaults.contact_process, ...(raw.contact_process ?? {}) },
    about_process: { ...defaults.about_process, ...(raw.about_process ?? {}) },
    about_code: { ...defaults.about_code, ...(raw.about_code ?? {}) },
    about_technology: { ...defaults.about_technology, ...(raw.about_technology ?? {}) },
  };
});
