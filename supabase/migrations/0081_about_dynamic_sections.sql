-- ============================================================================
-- Sitekoom — About dynamic sections (process timeline + technology philosophy)
-- Additive: only injects the two new keys, preserving all existing content.
-- ============================================================================
update public.site_settings
set value = value || $json${
  "about_process": {
    "enabled": true,
    "title_ar": "كيف نحوّل الفكرة إلى منتج رقمي؟",
    "title_en": "How We Turn Ideas Into Digital Products",
    "desc_ar": "كل مشروع ناجح يبدأ بفكرة واضحة، لكن تحويل الفكرة إلى منتج رقمي ناجح يحتاج إلى أكثر من مجرد كتابة الكود. في سايتكم نعمل على فهم الهدف، تحديد الاحتياج، بناء التجربة، ثم تطوير حل قابل للنمو والتوسع.",
    "desc_en": "Every successful digital project starts with an idea. Turning that idea into a successful product requires more than writing code. At Sitekoom, we understand the goal, define the requirements, shape the experience, and build a solution designed to grow.",
    "steps": [
      {"ar": {"title": "نفهم الفكرة", "desc": "نبدأ بفهم أهداف المشروع، جمهوره، واحتياجاته الحقيقية."}, "en": {"title": "Understand the Idea", "desc": "We start by understanding the project's goals, audience, and real needs."}, "icon": "target"},
      {"ar": {"title": "نخطط الحل", "desc": "نحوّل المتطلبات إلى هيكل واضح وتجربة مدروسة وقابلة للتنفيذ."}, "en": {"title": "Plan the Solution", "desc": "We transform requirements into a clear structure and a scalable experience."}, "icon": "layout-dashboard"},
      {"ar": {"title": "نبني التجربة", "desc": "نجمع بين التصميم والبرمجة والأداء لبناء منتج رقمي متكامل."}, "en": {"title": "Build the Experience", "desc": "We combine design, development, and performance to build a complete digital product."}, "icon": "code"},
      {"ar": {"title": "نطوّر ونوسّع", "desc": "نستمر في التحسين والتطوير حتى ينمو الحل مع نمو مشروعك."}, "en": {"title": "Improve & Scale", "desc": "We continue optimizing and evolving the solution as your business grows."}, "icon": "trending-up"}
    ]
  },
  "about_technology": {
    "enabled": true,
    "title_ar": "التقنية وحدها لا تكفي",
    "title_en": "Technology Alone Isn't Enough",
    "highlight_ar": "نحن نبني الحل حول مشروعك.",
    "highlight_en": "We Build Around Your Business.",
    "desc_ar": "نؤمن أن أفضل الحلول الرقمية ليست الأكثر تعقيدًا، بل الأكثر ملاءمة للهدف. لذلك نبدأ من احتياجك، ونختار التقنية والتصميم والبنية التي تخدم مشروعك اليوم وتبقى قادرة على التطور غدًا.",
    "desc_en": "We believe the best digital solutions are not the most complicated ones, but the ones that fit the goal. We start with your needs and choose the technology, design, and architecture that serve your business today and remain ready for tomorrow.",
    "items": [
      {"ar": {"title": "فهم حقيقي", "desc": "نفهم أهدافك قبل اختيار الحل."}, "en": {"title": "Real Understanding", "desc": "We understand your goals before choosing the solution."}},
      {"ar": {"title": "تجربة مستخدم", "desc": "نبني تجارب سهلة وواضحة وسريعة."}, "en": {"title": "User Experience", "desc": "We build clear, fast, and intuitive experiences."}},
      {"ar": {"title": "تقنية مناسبة", "desc": "نختار التقنية التي تخدم احتياج المشروع."}, "en": {"title": "Right Technology", "desc": "We choose technology based on what your project actually needs."}},
      {"ar": {"title": "أداء واستقرار", "desc": "نهتم بالسرعة والاستقرار وقابلية التوسع."}, "en": {"title": "Performance & Stability", "desc": "We care about speed, stability, and scalability."}},
      {"ar": {"title": "تطوير مستمر", "desc": "نبقى معك بعد الإطلاق للتحسين والنمو."}, "en": {"title": "Continuous Growth", "desc": "We stay with you after launch to improve and grow the product."}}
    ]
  }
}$json$::jsonb
where key = 'content_sections';
