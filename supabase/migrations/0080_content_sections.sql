-- ============================================================================
-- Sitekoom — Content sections (homepage intro + contact sections)
-- ============================================================================
insert into public.site_settings (key, value, is_public) values
('content_sections', '{
  "homepage_intro": {
    "enabled": true,
    "title_ar": "نصنع حضورك الرقمي، ونحوّل أفكارك إلى حلول",
    "title_en": "We craft your digital presence and turn ideas into solutions",
    "highlight_ar": "برمجة متطورة. تصميم استثنائي. نتائج حقيقية.",
    "highlight_en": "Advanced code. Exceptional design. Real results.",
    "desc_ar": "في سايتكم لا نبني مواقع إلكترونية تقليدية، بل نصمم تجارب رقمية متكاملة تساعد الشركات والأعمال على بناء حضور قوي، الوصول إلى عملائها، وتحويل الأفكار إلى منتجات رقمية قابلة للنمو. نجمع بين التصميم الحديث، البرمجة المتقدمة، الأداء العالي، وتجربة المستخدم لنقدم حلولًا رقمية مصممة حول احتياجات كل مشروع.",
    "desc_en": "At Sitekoom we do not build ordinary websites. We design complete digital experiences that help businesses build a strong presence, reach their customers, and turn ideas into scalable digital products. We combine modern design, advanced engineering, high performance, and user experience to deliver digital solutions built around the needs of every project.",
    "points_ar": ["حلول مصممة من الصفر", "أداء وسرعة وتجربة مستخدم محسّنة", "تقنيات حديثة وقابلة للتوسع", "دعم وتطوير مستمر بعد الإطلاق"],
    "points_en": ["Solutions built from scratch", "Performance, speed and a refined user experience", "Modern, scalable technology", "Continuous support and development after launch"],
    "cards": ["Scalable Architecture", "Modern Technology", "High Performance", "Built From Scratch"]
  },
  "contact_intro": {
    "enabled": true,
    "title_ar": "جاهزون لنقل فكرتك إلى العالم الرقمي",
    "title_en": "Ready to bring your idea to the digital world",
    "desc_ar": "سواء كنت تبدأ مشروعًا جديدًا، أو تطور نشاطًا قائمًا، أو تبحث عن نظام رقمي يساعدك على العمل بكفاءة أكبر، يعمل فريق سايتكم معك على تحويل احتياجك إلى حل واضح وقابل للتنفيذ والنمو.",
    "desc_en": "Whether you are starting a new project, growing an existing business, or looking for a digital system that helps you work more efficiently, the Sitekoom team works with you to turn your need into a clear, actionable and scalable solution.",
    "points_ar": ["نفهم احتياجك قبل أن نبدأ", "نخطط للحل قبل كتابة الكود", "نبني تجربة سهلة وسريعة", "نستمر معك بعد الإطلاق"],
    "points_en": ["We understand your needs before we start", "We plan the solution before writing code", "We build an easy, fast experience", "We stay with you after launch"]
  },
  "contact_process": {
    "enabled": true,
    "title_ar": "من الفكرة الأولى إلى الحل الكامل",
    "title_en": "From the first idea to the complete solution",
    "desc_ar": "نؤمن أن المشروع الرقمي الناجح لا يعتمد على التقنية وحدها، بل على فهم الهدف الحقيقي وراء المشروع. لذلك نعمل على الجمع بين الاستراتيجية، التصميم، البرمجة، والأداء في تجربة واحدة متكاملة.",
    "desc_en": "We believe a successful digital project is not only about technology, but about understanding the real goal behind the project. That is why we combine strategy, design, engineering, and performance into one integrated experience.",
    "steps": [
      {"ar": "فهم الفكرة", "en": "Understand the idea"},
      {"ar": "تخطيط الحل", "en": "Plan the solution"},
      {"ar": "التصميم والتطوير", "en": "Design & development"},
      {"ar": "الإطلاق والتحسين", "en": "Launch & improvement"}
    ]
  }
}'::jsonb, true)
on conflict (key) do nothing;
