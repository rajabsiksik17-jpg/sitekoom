-- ============================================================================
-- Sitekoom — About code section (From Idea to Working Code)
-- Additive: only injects the new key, preserving all existing content.
-- ============================================================================
update public.site_settings
set value = value || $json${
  "about_code": {
    "enabled": true,
    "title_ar": "نحوّل التعقيد إلى تجربة بسيطة.",
    "title_en": "We Turn Complexity Into Simplicity.",
    "desc_ar": "خلف كل تجربة رقمية ناجحة، هناك بنية مدروسة وكود مكتوب ليعمل بكفاءة، لا ليبدو جيدًا فقط. في سايتكم نبني الحل من الداخل إلى الخارج، من منطق النظام والبيانات إلى الواجهة التي يتعامل معها المستخدم كل يوم.",
    "desc_en": "Behind every successful digital experience is thoughtful architecture and code built to perform, not simply to look good. At Sitekoom, we build from the inside out — from system logic and data to the interface users interact with every day.",
    "filename": "SITEKOOM_CORE/architecture.ts",
    "tabs": ["architecture.ts", "database.sql", "api.ts"]
  }
}$json$::jsonb
where key = 'content_sections';
