-- ============================================================================
-- Sitekoom — SEO content update (home / static pages / core services)
-- Updates existing seo_metadata rows; adds service SEO by slug. No schema
-- changes, no data deletion.
-- ============================================================================

-- Helper: upsert static-page SEO (entity_id IS NULL). Unique constraints treat
-- NULLs as distinct, so we UPDATE then INSERT only if missing.
create or replace function public.__seed_static_seo(
  etype text, loc text, seo_title text, meta_desc text, focus text, kws text[],
  og_title text, og_desc text
) returns void language plpgsql as $$
begin
  update public.seo_metadata
  set seo_title = __seed_static_seo.seo_title,
      meta_description = __seed_static_seo.meta_desc,
      focus_keyword = __seed_static_seo.focus,
      keywords = __seed_static_seo.kws,
      og_title = __seed_static_seo.og_title,
      og_description = __seed_static_seo.og_desc,
      robots = 'index, follow',
      twitter_card = 'summary_large_image'
  where entity_type = etype and entity_id is null and locale = loc;

  if not found then
    insert into public.seo_metadata (entity_type, entity_id, locale, seo_title, meta_description, focus_keyword, keywords, og_title, og_description, robots, twitter_card)
    values (etype, null, loc, seo_title, meta_desc, focus, kws, og_title, og_desc, 'index, follow', 'summary_large_image');
  end if;
end $$;

-- Helper: upsert service SEO by service slug.
create or replace function public.__seed_service_seo(
  slug text, loc text, seo_title text, meta_desc text, focus text, kws text[],
  og_title text, og_desc text
) returns void language plpgsql as $$
begin
  insert into public.seo_metadata (entity_type, entity_id, locale, seo_title, meta_description, focus_keyword, keywords, og_title, og_description, robots, twitter_card)
  values ('service', (select id from public.services where public.services.slug = __seed_service_seo.slug), loc, seo_title, meta_desc, focus, kws, og_title, og_desc, 'index, follow', 'summary_large_image')
  on conflict (entity_type, entity_id, locale) do update set
    seo_title = excluded.seo_title, meta_description = excluded.meta_description,
    focus_keyword = excluded.focus_keyword, keywords = excluded.keywords,
    og_title = excluded.og_title, og_description = excluded.og_description,
    robots = excluded.robots, twitter_card = excluded.twitter_card;
end $$;

-- ---------------------------------------------------------------------------
-- Homepage
-- ---------------------------------------------------------------------------
select public.__seed_static_seo('home', 'ar',
  'سايتكم | وكالة رقمية وحلول برمجية وتصميم مواقع ومتاجر وتطبيقات',
  'سايتكم وكالة رقمية متخصصة في تصميم وتطوير المواقع والمتاجر الإلكترونية وتطبيقات الهاتف والحلول البرمجية والتسويق الرقمي وSEO في الوطن العربي والشرق الأوسط.',
  'سايتكم وكالة رقمية في الأردن',
  array['سايتكم','شركة سايتكم','وكالة سايتكم','سايتكم الأردن','شركة تصميم مواقع','تصميم مواقع الأردن','برمجة مواقع','تصميم متجر إلكتروني','برمجة تطبيقات','تطبيقات الهاتف','حلول برمجية','حلول رقمية','وكالة رقمية','تسويق رقمي','SEO الأردن'],
  'سايتكم | وكالة رقمية وحلول برمجية وتصميم مواقع ومتاجر وتطبيقات',
  'سايتكم وكالة رقمية متخصصة في تصميم وتطوير المواقع والمتاجر الإلكترونية وتطبيقات الهاتف والحلول البرمجية والتسويق الرقمي وSEO.');

select public.__seed_static_seo('home', 'en',
  'Sitekoom | Digital Agency, Web Design, E-commerce & Mobile Apps',
  'Sitekoom is a digital agency specializing in web design, e-commerce, mobile apps, software solutions, digital marketing and SEO across the Arab world and Middle East.',
  'Sitekoom Digital Agency Jordan',
  array['Sitekoom','Sitekoom Jordan','Sitekoom Agency','Web Design Jordan','Web Development Jordan','E-commerce Development Jordan','Mobile App Development Jordan','Digital Agency Jordan','Digital Solutions Jordan','SEO Agency Jordan','Digital Marketing Jordan'],
  'Sitekoom | Digital Agency, Web Design, E-commerce & Mobile Apps',
  'Sitekoom is a digital agency specializing in web design, e-commerce, mobile apps, software solutions, digital marketing and SEO.');

-- ---------------------------------------------------------------------------
-- Static pages
-- ---------------------------------------------------------------------------
select public.__seed_static_seo('about', 'ar',
  'من نحن | سايتكم – وكالة رقمية وحلول تقنية في الأردن',
  'تعرف على سايتكم، وكالة رقمية أردنية متخصصة في تصميم وتطوير المواقع والمتاجر والتطبيقات والحلول البرمجية.',
  'سايتكم وكالة رقمية', array['سايتكم','وكالة رقمية','شركة تقنية','سايتكم الأردن'],
  'من نحن | سايتكم', 'تعرف على وكالة سايتكم الرقمية وخدماتها التقنية.');

select public.__seed_static_seo('about', 'en',
  'About Sitekoom | Digital Agency & Technology Solutions in Jordan',
  'Learn about Sitekoom, a Jordanian digital agency for web design, e-commerce, mobile apps and custom software.',
  'About Sitekoom', array['Sitekoom','digital agency','technology solutions','Sitekoom Jordan'],
  'About Sitekoom', 'Learn about Sitekoom digital agency and its technology services.');

select public.__seed_static_seo('contact', 'ar',
  'تواصل مع سايتكم | شركة تصميم مواقع وحلول رقمية في الأردن',
  'تواصل مع فريق سايتكم لبدء مشروعك في تصميم موقع أو متجر إلكتروني أو تطبيق أو حل برمجي مخصص.',
  'تواصل مع سايتكم', array['سايتكم','تواصل معنا','شركة تصميم مواقع','حلول رقمية'],
  'تواصل مع سايتكم', 'تواصل مع وكالة سايتكم الرقمية لبدء مشروعك.');

select public.__seed_static_seo('contact', 'en',
  'Contact Sitekoom | Web Design & Digital Solutions Agency Jordan',
  'Contact Sitekoom to start your website, e-commerce store, mobile app or custom software project.',
  'Contact Sitekoom', array['Sitekoom','contact us','web design','digital solutions'],
  'Contact Sitekoom', 'Contact the Sitekoom digital agency to start your project.');

select public.__seed_static_seo('projects', 'ar',
  'أعمال سايتكم | مشاريع مواقع ومتاجر وتطبيقات وحلول رقمية',
  'استعرض أعمال ومشاريع سايتكم في تصميم المواقع والمتاجر الإلكترونية والتطبيقات والحلول الرقمية.',
  'أعمال سايتكم', array['أعمال سايتكم','مشاريع مواقع','متاجر إلكترونية','تطبيقات','سايتكم'],
  'أعمال سايتكم', 'استعرض مشاريع سايتكم الرقمية.');

select public.__seed_static_seo('projects', 'en',
  'Sitekoom Portfolio | Websites, E-commerce Stores & Digital Projects',
  'Explore Sitekoom portfolio of websites, e-commerce stores, mobile apps and digital projects.',
  'Sitekoom Portfolio', array['Sitekoom portfolio','websites','e-commerce','mobile apps'],
  'Sitekoom Portfolio', 'Explore Sitekoom digital projects and portfolio.');

-- ---------------------------------------------------------------------------
-- Core services
-- ---------------------------------------------------------------------------
select public.__seed_service_seo('web-development', 'ar',
  'تصميم مواقع إلكترونية في الأردن | شركة تصميم وتطوير مواقع | سايتكم',
  'تصميم وتطوير مواقع إلكترونية احترافية للشركات والمؤسسات في الأردن مع تصميم متجاوب وسرعة وأداء جيد وSEO وتجربة مستخدم احترافية من سايتكم.',
  'تصميم مواقع في الأردن',
  array['تصميم مواقع','تصميم مواقع إلكترونية','تطوير مواقع','شركة تصميم مواقع','تصميم مواقع الأردن','WordPress'],
  'تصميم مواقع إلكترونية في الأردن | سايتكم',
  'تصميم وتطوير مواقع إلكترونية احترافية ومتجاوبة من سايتكم.');

select public.__seed_service_seo('web-development', 'en',
  'Web Design & Development Jordan | Professional Website Design | Sitekoom',
  'Professional website design and development in Jordan for businesses and organizations, with responsive design, performance, SEO-ready structure and great user experience.',
  'Web Design Jordan',
  array['web design Jordan','website development Jordan','web development company Jordan','website design company Jordan','WordPress development'],
  'Web Design & Development Jordan | Sitekoom',
  'Professional website design and development in Jordan by Sitekoom.');

select public.__seed_service_seo('ecommerce', 'ar',
  'تصميم متجر إلكتروني في الأردن | WooCommerce ومتاجر احترافية | سايتكم',
  'تصميم وتطوير متاجر إلكترونية احترافية باستخدام WooCommerce مع إدارة المنتجات والطلبات والدفع والشحن وتجربة شراء متكاملة من سايتكم.',
  'تصميم متجر إلكتروني في الأردن',
  array['تصميم متجر إلكتروني','تطوير متجر إلكتروني','شركة تصميم متاجر إلكترونية','متجر إلكتروني','WooCommerce'],
  'تصميم متجر إلكتروني في الأردن | سايتكم',
  'تصميم وتطوير متاجر إلكترونية احترافية بـ WooCommerce من سايتكم.');

select public.__seed_service_seo('ecommerce', 'en',
  'E-commerce Website Development Jordan | WooCommerce Stores | Sitekoom',
  'Professional e-commerce store design and WooCommerce development in Jordan with products, orders, payments, shipping and optimized shopping experiences.',
  'E-commerce Development Jordan',
  array['e-commerce development Jordan','WooCommerce development','e-commerce website design','online store development'],
  'E-commerce Website Development Jordan | Sitekoom',
  'Professional e-commerce and WooCommerce store development by Sitekoom.');

select public.__seed_service_seo('mobile-apps', 'ar',
  'برمجة تطبيقات الهاتف في الأردن | Android وiOS | سايتكم',
  'تطوير تطبيقات الهاتف Android وiOS للشركات والمشاريع الناشئة والخدمات الرقمية مع تصميم واجهات وتجربة مستخدم وربط APIs وقواعد البيانات.',
  'برمجة تطبيقات في الأردن',
  array['برمجة تطبيقات','تطبيقات الهاتف','تطبيقات أندرويد','تطبيقات iOS','شركة تطوير تطبيقات'],
  'برمجة تطبيقات الهاتف في الأردن | سايتكم',
  'تطوير تطبيقات Android وiOS للشركات والمشاريع من سايتكم.');

select public.__seed_service_seo('mobile-apps', 'en',
  'Mobile App Development Jordan | Android & iOS Apps | Sitekoom',
  'Professional Android and iOS mobile app development in Jordan with UI/UX design, APIs, databases and custom digital integrations.',
  'Mobile App Development Jordan',
  array['mobile app development Jordan','Android app development','iOS app development','app development company'],
  'Mobile App Development Jordan | Sitekoom',
  'Professional Android and iOS mobile app development by Sitekoom.');

select public.__seed_service_seo('custom-software', 'ar',
  'حلول برمجية وتطوير أنظمة مخصصة | سايتكم',
  'تطوير حلول برمجية وأنظمة مخصصة للشركات والمنصات الرقمية مع لوحات تحكم وقواعد بيانات وواجهات API وتكاملات تقنية.',
  'حلول برمجية مخصصة',
  array['حلول برمجية','تطوير أنظمة','أنظمة مخصصة','برمجة','سايتكم'],
  'حلول برمجية وتطوير أنظمة مخصصة | سايتكم',
  'تطوير حلول برمجية وأنظمة مخصصة للشركات من سايتكم.');

select public.__seed_service_seo('custom-software', 'en',
  'Custom Software Development & Digital Solutions | Sitekoom',
  'Custom software development and digital solutions for businesses and platforms, including dashboards, APIs, databases and technology integrations.',
  'Custom Software Development',
  array['custom software development','software development Jordan','digital solutions','software solutions Jordan'],
  'Custom Software Development | Sitekoom',
  'Custom software development and digital solutions by Sitekoom.');

select public.__seed_service_seo('seo-content', 'ar',
  'SEO وتحسين محركات البحث | تحسين ظهور المواقع في Google | سايتكم',
  'خدمات تحسين محركات البحث SEO من سايتكم لتحسين بنية الموقع والمحتوى والكلمات المفتاحية والظهور في نتائج Google.',
  'SEO في الأردن',
  array['SEO','تحسين محركات البحث','SEO الأردن','تصدر Google'],
  'SEO وتحسين محركات البحث | سايتكم',
  'خدمات SEO لتحسين ظهور المواقع في Google من سايتكم.');

select public.__seed_service_seo('seo-content', 'en',
  'SEO Services & Search Engine Optimization | Sitekoom',
  'SEO services designed to improve website visibility on Google through technical SEO, content optimization, keywords, internal linking and performance.',
  'SEO Agency Jordan',
  array['SEO services Jordan','search engine optimization','SEO agency Jordan','technical SEO'],
  'SEO Services | Sitekoom',
  'SEO services to improve website visibility on Google by Sitekoom.');

select public.__seed_service_seo('digital-marketing-consulting', 'ar',
  'التسويق الرقمي وإدارة المحتوى والإعلانات | سايتكم',
  'خدمات التسويق الرقمي وصناعة المحتوى وإدارة وسائل التواصل الاجتماعي والحملات الإعلانية لبناء حضور رقمي أقوى للعلامات التجارية.',
  'التسويق الرقمي في الأردن',
  array['التسويق الرقمي','تسويق إلكتروني','إدارة السوشيال ميديا','الإعلانات','سايتكم'],
  'التسويق الرقمي | سايتكم',
  'خدمات التسويق الرقمي والمحتوى والإعلانات من سايتكم.');

select public.__seed_service_seo('digital-marketing-consulting', 'en',
  'Digital Marketing Agency Jordan | Social Media, Content & Advertising | Sitekoom',
  'Digital marketing services including social media management, content creation, advertising campaigns and digital growth strategies for businesses and brands.',
  'Digital Marketing Jordan',
  array['digital marketing Jordan','social media marketing','content marketing','advertising','digital marketing agency'],
  'Digital Marketing Agency Jordan | Sitekoom',
  'Digital marketing, social media and advertising services by Sitekoom.');

drop function if exists public.__seed_static_seo(text, text, text, text, text, text[], text, text);
drop function if exists public.__seed_service_seo(text, text, text, text, text, text[], text, text);
