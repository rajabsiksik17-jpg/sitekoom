-- ============================================================================
-- Sitekoom — Content population (Article 3 + tags + article SEO)
-- ============================================================================

insert into public.articles (id, title_ar, title_en, slug, excerpt_ar, excerpt_en, content_ar, content_en, category_id, status, published_at, is_featured)
values (
  '60000000-0000-0000-0000-000000000013',
  'كيف تختار الحل التقني المناسب لمشروعك: موقع، متجر، تطبيق أم نظام مخصص؟',
  'How to Choose the Right Digital Solution: Website, Store, App or Custom System?',
  'how-to-choose-right-digital-solution',
  $c$اختيار التقنية المناسبة يبدأ بفهم هدف المشروع وطبيعة العملاء والعمليات التي تريد تطويرها، وليس باختيار التقنية الأكثر شهرة.$c$,
  $c$Choosing the right technology starts with understanding your business goals, customers and processes—not simply choosing the most popular technology.$c$,
  $c$<p>عند بدء مشروع رقمي جديد، قد يكون من الصعب تحديد الحل المناسب.</p><p>هل تحتاج إلى موقع إلكتروني؟ متجر؟ تطبيق موبايل؟ أم نظام مخصص؟</p><p>الإجابة تعتمد على طبيعة المشروع وأهدافه.</p><h2>الموقع الإلكتروني</h2><p>إذا كان هدفك تقديم الشركة والخدمات والمعلومات وبناء حضور رقمي، فإن الموقع التعريفي غالبًا يكون نقطة البداية المناسبة.</p><h2>المتجر الإلكتروني</h2><p>إذا كنت تبيع منتجات أو خدمات مباشرة للعملاء، فإن المتجر الإلكتروني يوفر تجربة شراء وإدارة للمنتجات والطلبات والدفع والشحن.</p><h2>تطبيق الموبايل</h2><p>التطبيق مناسب عندما يحتاج العميل إلى استخدام الخدمة بشكل متكرر من الهاتف أو عندما تكون هناك خصائص خاصة بالموبايل.</p><h2>النظام المخصص</h2><p>عندما تكون العمليات الداخلية معقدة أو لا تغطي الحلول الجاهزة احتياجاتك، قد يكون النظام المخصص هو الخيار الأفضل.</p><h2>ERP وCRM وPOS</h2><p>الشركات التي لديها عمليات كبيرة أو عدة أقسام وفروع قد تحتاج إلى ERP أو CRM أو POS لإدارة العمليات بشكل أكثر تكاملًا.</p><h2>لا تبدأ بالتقنية</h2><p>القرار الصحيح يبدأ بالسؤال:</p><ul><li>ما المشكلة التي نريد حلها؟</li><li>من هم المستخدمون؟</li><li>ما العمليات؟</li><li>ما النتائج المطلوبة؟</li></ul><p>بعد ذلك يتم اختيار التقنية المناسبة.</p><h2>الخلاصة</h2><p>لا يوجد حل واحد مناسب لجميع المشاريع.</p><p>الحل الأفضل هو الذي يتناسب مع أهدافك الحالية ويمكن تطويره مع نمو المشروع.</p>$c$,
  $c$<p>Starting a digital project can raise an important question: what solution do you actually need?</p><p>A website? An online store? A mobile app? Or custom software?</p><p>The answer depends on your business model and objectives.</p><h2>Website</h2><p>If your primary goal is to present your company, services and information online, a professional corporate website may be the right starting point.</p><h2>E-Commerce</h2><p>If you sell products or services directly to customers, an e-commerce platform provides the tools needed for products, orders, payments and shipping.</p><h2>Mobile Application</h2><p>A mobile application can be useful when customers frequently use your service from their phones or when mobile-specific functionality is required.</p><h2>Custom Software</h2><p>When your internal processes are complex and existing software cannot meet your requirements, custom software may provide a better solution.</p><h2>ERP, CRM and POS</h2><p>Businesses with multiple departments, branches or complex operations may benefit from ERP, CRM or POS systems.</p><h2>Don''t Start With Technology</h2><p>Start by asking:</p><ul><li>What problem are we solving?</li><li>Who are the users?</li><li>What processes need improvement?</li><li>What results do we want?</li></ul><p>Only then should you select the appropriate technology.</p><h2>Conclusion</h2><p>There is no single solution that fits every business.</p><p>The best technology is the one that supports your current objectives and can evolve as your business grows.</p>$c$,
  '40000000-0000-0000-0000-000000000002',
  'published', now() - interval '2 days', false
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  excerpt_ar = excluded.excerpt_ar,
  excerpt_en = excluded.excerpt_en,
  content_ar = excluded.content_ar,
  content_en = excluded.content_en,
  category_id = excluded.category_id,
  status = excluded.status,
  published_at = excluded.published_at,
  is_featured = excluded.is_featured;

-- Article tag relations
delete from public.article_tag_relations where article_id in ('60000000-0000-0000-0000-000000000011','60000000-0000-0000-0000-000000000012','60000000-0000-0000-0000-000000000013');

insert into public.article_tag_relations (article_id, tag_id) values
  ('60000000-0000-0000-0000-000000000011','50000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000011','50000000-0000-0000-0000-000000000002'),
  ('60000000-0000-0000-0000-000000000012','50000000-0000-0000-0000-000000000003'),
  ('60000000-0000-0000-0000-000000000013','50000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000013','50000000-0000-0000-0000-000000000002')
on conflict do nothing;

-- Article SEO (AR)
insert into public.seo_metadata (entity_type, entity_id, locale, seo_title, meta_description, focus_keyword, keywords, canonical_url, og_title, og_description)
values
  ('article','60000000-0000-0000-0000-000000000011','ar',
   $c$كيف يساعد الموقع الإلكتروني الاحترافي شركتك على النمو | Sitekoom$c$,
   $c$اكتشف كيف يساعد الموقع الإلكتروني الاحترافي شركتك على بناء الثقة وجذب العملاء من محركات البحث وتحويل الزوار إلى عملاء.$c$,
   $c$الموقع الإلكتروني الاحترافي$c$,
   ARRAY[$c$تصميم مواقع$c$,$c$شركة برمجة الأردن$c$,$c$تطوير مواقع$c$,$c$SEO$c$],
   $c$/blog/professional-website-helps-business-grow$c$,
   $c$كيف يساعد الموقع الإلكتروني الاحترافي شركتك على النمو | Sitekoom$c$,
   $c$اكتشف كيف يساعد الموقع الإلكتروني الاحترافي شركتك على بناء الثقة وجذب العملاء.$c$),
  ('article','60000000-0000-0000-0000-000000000012','ar',
   $c$لماذا تحتاج الشركات إلى التحول الرقمي في 2026 | Sitekoom$c$,
   $c$تعرف على أهمية التحول الرقمي للشركات وكيف تساعد الأنظمة الرقمية في تحسين الكفاءة وتجربة العميل واتخاذ القرارات.$c$,
   $c$التحول الرقمي$c$,
   ARRAY[$c$التحول الرقمي$c$,$c$أنظمة ERP$c$,$c$أتمتة العمليات$c$,$c$تحسين تجربة العميل$c$],
   $c$/blog/digital-transformation-2026$c$,
   $c$لماذا تحتاج الشركات إلى التحول الرقمي في 2026 | Sitekoom$c$,
   $c$تعرف على أهمية التحول الرقمي للشركات في تحسين الكفاءة واتخاذ القرارات.$c$),
  ('article','60000000-0000-0000-0000-000000000013','ar',
   $c$كيف تختار الحل التقني المناسب لمشروعك | Sitekoom$c$,
   $c$دليل عملي لاختيار الحل الرقمي المناسب: موقع، متجر، تطبيق أم نظام مخصص؟ تعرف على الفرق بين الخيارات.$c$,
   $c$اختيار الحل التقني$c$,
   ARRAY[$c$موقع إلكتروني$c$,$c$متجر إلكتروني$c$,$c$تطبيق موبايل$c$,$c$نظام مخصص$c$],
   $c$/blog/how-to-choose-right-digital-solution$c$,
   $c$كيف تختار الحل التقني المناسب لمشروعك | Sitekoom$c$,
   $c$دليل عملي لاختيار الحل الرقمي المناسب لمشروعك.$c$)
on conflict (entity_type, entity_id, locale) do update set
  seo_title = excluded.seo_title,
  meta_description = excluded.meta_description,
  focus_keyword = excluded.focus_keyword,
  keywords = excluded.keywords,
  canonical_url = excluded.canonical_url,
  og_title = excluded.og_title,
  og_description = excluded.og_description;

-- Article SEO (EN)
insert into public.seo_metadata (entity_type, entity_id, locale, seo_title, meta_description, focus_keyword, keywords, canonical_url, og_title, og_description)
values
  ('article','60000000-0000-0000-0000-000000000011','en',
   $c$How a Professional Website Helps Your Business Grow | Sitekoom$c$,
   $c$Discover how a professional website helps your business build trust, attract customers through search and turn visitors into leads.$c$,
   $c$professional website$c$,
   ARRAY[$c$web design$c$,$c$web development Jordan$c$,$c$SEO$c$,$c$website growth$c$],
   $c$/blog/professional-website-helps-business-grow$c$,
   $c$How a Professional Website Helps Your Business Grow | Sitekoom$c$,
   $c$Discover how a professional website helps your business grow.$c$),
  ('article','60000000-0000-0000-0000-000000000012','en',
   $c$Why Businesses Need Digital Transformation in 2026 | Sitekoom$c$,
   $c$Learn why digital transformation matters and how digital systems improve efficiency, customer experience and decision making.$c$,
   $c$digital transformation$c$,
   ARRAY[$c$digital transformation$c$,$c$ERP$c$,$c$business automation$c$,$c$customer experience$c$],
   $c$/blog/digital-transformation-2026$c$,
   $c$Why Businesses Need Digital Transformation in 2026 | Sitekoom$c$,
   $c$Learn why digital transformation matters for modern businesses.$c$),
  ('article','60000000-0000-0000-0000-000000000013','en',
   $c$How to Choose the Right Digital Solution for Your Project | Sitekoom$c$,
   $c$A practical guide to choosing the right digital solution: website, store, app or custom system. Learn the difference between the options.$c$,
   $c$choose digital solution$c$,
   ARRAY[$c$website$c$,$c$e-commerce$c$,$c$mobile app$c$,$c$custom software$c$],
   $c$/blog/how-to-choose-right-digital-solution$c$,
   $c$How to Choose the Right Digital Solution for Your Project | Sitekoom$c$,
   $c$A practical guide to choosing the right digital solution.$c$)
on conflict (entity_type, entity_id, locale) do update set
  seo_title = excluded.seo_title,
  meta_description = excluded.meta_description,
  focus_keyword = excluded.focus_keyword,
  keywords = excluded.keywords,
  canonical_url = excluded.canonical_url,
  og_title = excluded.og_title,
  og_description = excluded.og_description;
