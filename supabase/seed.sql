-- ============================================================================
-- Sitekoom — Seed data
-- Run AFTER the schema migration. Safe to re-run (uses ON CONFLICT).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (key, name_ar, name_en, group_key, sort) values
  ('dashboard.view',      'عرض لوحة التحكم',              'View Dashboard',            'dashboard',     1),
  ('contacts.view',       'عرض طلبات التواصل',            'View Contact Requests',     'contacts',      2),
  ('contacts.manage',     'إدارة طلبات التواصل',          'Manage Contact Requests',   'contacts',      3),
  ('chat.view',           'عرض المحادثات',                'View Live Chat',            'chat',          4),
  ('chat.manage',         'إدارة المحادثات',              'Manage Live Chat',          'chat',          5),
  ('services.view',       'عرض الخدمات',                  'View Services',             'services',      6),
  ('services.manage',     'إدارة الخدمات',                'Manage Services',           'services',      7),
  ('projects.view',       'عرض الأعمال',                  'View Projects',             'projects',      8),
  ('projects.manage',     'إدارة الأعمال',                'Manage Projects',           'projects',      9),
  ('articles.view',       'عرض المقالات',                'View Articles',             'articles',     10),
  ('articles.manage',     'إدارة المقالات',              'Manage Articles',           'articles',     11),
  ('homepage.view',       'عرض محتوى الرئيسية',          'View Homepage',             'homepage',     12),
  ('homepage.manage',     'إدارة محتوى الرئيسية',        'Manage Homepage',           'homepage',     13),
  ('company.view',        'عرض محتوى الشركة',            'View Company',              'company',      14),
  ('company.manage',      'إدارة محتوى الشركة',          'Manage Company',            'company',      15),
  ('social.view',         'عرض التواصل الاجتماعي',       'View Social Media',         'social',       16),
  ('social.manage',       'إدارة التواصل الاجتماعي',     'Manage Social Media',       'social',       17),
  ('media.view',          'عرض مكتبة الوسائط',           'View Media Library',        'media',        18),
  ('media.manage',        'إدارة مكتبة الوسائط',         'Manage Media Library',      'media',        19),
  ('seo.view',            'عرض إعدادات SEO',             'View SEO',                  'seo',          20),
  ('seo.manage',          'إدارة إعدادات SEO',           'Manage SEO',                'seo',          21),
  ('analytics.view',      'عرض التحليلات',               'View Analytics',            'analytics',    22),
  ('notifications.view',  'عرض الإشعارات',               'View Notifications',        'notifications',23),
  ('users.view',          'عرض المستخدمين',              'View Users',                'users',        24),
  ('users.manage',        'إدارة المستخدمين',            'Manage Users',              'users',        25),
  ('roles.view',          'عرض الأدوار والصلاحيات',      'View Roles',                'roles',        26),
  ('roles.manage',        'إدارة الأدوار والصلاحيات',    'Manage Roles',              'roles',        27),
  ('settings.view',       'عرض الإعدادات',               'View Settings',             'settings',     28),
  ('settings.manage',     'إدارة الإعدادات',             'Manage Settings',           'settings',     29),
  ('integrations.view',   'عرض التكاملات',               'View Integrations',         'integrations', 30),
  ('integrations.manage', 'إدارة التكاملات',             'Manage Integrations',       'integrations', 31),
  ('audit.view',          'عرض سجل النشاطات',            'View Audit Log',            'audit',        32)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
insert into public.roles (key, name_ar, name_en, description, is_super, is_system) values
  ('super_admin', 'الإدارة العامة', 'Super Admin', 'صلاحية كاملة على كل النظام', true, true),
  ('partial_admin', 'إدارة جزئية', 'Partial Admin', 'صلاحيات مخصصة يحددها الإدارة العامة', false, true),
  ('communication_manager', 'مدير التواصل', 'Communication Manager', 'إدارة المحادثة المباشرة فقط', false, true)
on conflict (key) do nothing;

-- Super admin has no role_permissions needed (bypass), but assign all for clarity.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key from public.roles r cross join public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- Partial admin default: view most, manage content, but NOT users/roles/settings.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key from public.roles r cross join public.permissions p
where r.key = 'partial_admin'
  and p.key in (
    'dashboard.view','contacts.view','contacts.manage','services.view','services.manage',
    'projects.view','projects.manage','articles.view','articles.manage',
    'homepage.view','homepage.manage','company.view','company.manage',
    'social.view','social.manage','media.view','media.manage','seo.view','seo.manage',
    'analytics.view','notifications.view'
  )
on conflict do nothing;

-- Communication manager: live chat only.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key from public.roles r cross join public.permissions p
where r.key = 'communication_manager'
  and p.key in ('dashboard.view','chat.view','chat.manage','notifications.view')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
insert into public.services (id, title_ar, title_en, slug, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, is_featured, sort) values
  ('10000000-0000-0000-0000-000000000001','المواقع الإلكترونية','Web Development','web-development','globe',
   'بناء مواقع تعريفية احترافية للشركات والمؤسسات.','Professional corporate and business websites.',
   'نقوم بتصميم وتطوير مواقع إلكترونية تعريفية احترافية تعكس هوية علامتك التجارية، مع تركيز كامل على الأداء والسرعة وتجربة المستخدم وتحسين محركات البحث.','We design and develop professional corporate websites that reflect your brand identity, with a full focus on performance, speed, user experience and SEO.', true, 1),
  ('10000000-0000-0000-0000-000000000002','المتاجر الإلكترونية','E-Commerce','ecommerce','shopping-cart',
   'إنشاء متاجر إلكترونية متكاملة وقابلة للنمو.','Complete, scalable e-commerce stores.',
   'نبني متاجر إلكترونية متكاملة قابلة للتوسع تشمل إدارة المنتجات والطلبات والمدفوعات والشحن، مع دعم WooCommerce والمنصات المخصصة.','We build complete, scalable online stores including product, order, payment and shipping management, with WooCommerce and custom platform support.', true, 2),
  ('10000000-0000-0000-0000-000000000003','البرمجة المخصصة','Custom Software','custom-software','code',
   'تطوير الأنظمة والمنصات حسب احتياجات العميل.','Tailor-made systems and platforms.',
   'نطوّر أنظمة ومنصات برمجية مخصصة حسب احتياجات عملك بالضبط، من الفكرة حتى الإطلاق، بأعلى معايير الجودة والأمان.','We develop custom software systems and platforms built exactly around your business needs, from idea to launch, with the highest quality and security standards.', true, 3),
  ('10000000-0000-0000-0000-000000000004','تطبيقات الموبايل','Mobile Apps','mobile-apps','smartphone',
   'تطوير تطبيقات Android وiOS.','Android and iOS application development.',
   'نطوّر تطبيقات موبايل أصلية وهجينة لنظامي Android وiOS بتجربة استخدام سلسة وأداء عالٍ.','We develop native and cross-platform mobile applications for Android and iOS with a smooth user experience and high performance.', true, 4),
  ('10000000-0000-0000-0000-000000000005','أنظمة ERP','ERP Systems','erp-systems','layout-dashboard',
   'أنظمة إدارة موارد المؤسسات.','Enterprise Resource Planning systems.',
   'أنظمة ERP متكاملة لإدارة موارد مؤسستك من المحاسبة والمخزون والمشتريات والموارد البشرية في منصة واحدة.','Integrated ERP systems to manage your enterprise resources — accounting, inventory, procurement and HR — in one platform.', true, 5),
  ('10000000-0000-0000-0000-000000000006','أنظمة POS','POS Systems','pos-systems','store',
   'أنظمة نقاط البيع وإدارة الفروع والمبيعات.','Point of sale and branch/sales management.',
   'أنظمة نقاط بيع حديثة لإدارة الفروع والمبيعات والفواتير والكاشير مع تقارير لحظية.','Modern point-of-sale systems for managing branches, sales, invoices and cashiers with real-time reporting.', true, 6),
  ('10000000-0000-0000-0000-000000000007','أنظمة CRM','CRM Systems','crm-systems','users',
   'إدارة العملاء والمبيعات والعلاقات.','Customer, sales and relationship management.',
   'أنظمة CRM لإدارة العملاء والمبيعات والمتابعة وعلاقات العملاء بهدف زيادة التحويل ورضا العملاء.','CRM systems to manage customers, sales, follow-ups and relationships to increase conversions and satisfaction.', true, 7),
  ('10000000-0000-0000-0000-000000000008','الأنظمة الإدارية','Administrative Systems','administrative-systems','settings',
   'أنظمة الموارد البشرية والمحاسبة والمخزون وغيرها.','HR, accounting, inventory and more.',
   'أنظمة إدارية مخصصة للموارد البشرية والمحاسبة والمخزون وإدارة العمليات الداخلية لمؤسستك.','Custom administrative systems for HR, accounting, inventory and internal operations management.', true, 8)
on conflict (slug) do nothing;

-- Service features (sample)
insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort)
select s.id, t.kind, t.icon, t.title_ar, t.title_en, t.description_ar, t.description_en, t.sort
from public.services s
join (values
  ('web-development','feature','zap','سرعة عالية','High Performance','مواقع سريعة محسّنة الأداء.','Fast, performance-optimized websites.',1),
  ('web-development','feature','search','تحسين SEO','SEO Optimized','بنية مهيأة لمحركات البحث.','Search-engine-friendly architecture.',2),
  ('web-development','feature','smartphone','متجاوب كلياً','Fully Responsive','يعمل على جميع الأجهزة.','Works on every device.',3)
) as t(slug, kind, icon, title_ar, title_en, description_ar, description_en, sort)
on s.slug = t.slug
on conflict do nothing;

-- Service FAQs (sample)
insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort)
select s.id, t.q_ar, t.q_en, t.a_ar, t.a_en, t.sort
from public.services s
join (values
  ('web-development','كم يستغرق تطوير الموقع؟','How long does website development take?','يعتمد على حجم المشروع، وعادة يتراوح بين أسبوعين إلى 8 أسابيع.','It depends on scope; typically 2 to 8 weeks.',1),
  ('web-development','هل الموقع متوافق مع الجوال؟','Is the website mobile friendly?','نعم، جميع مواقعنا متجاوبة بالكامل مع جميع الأجهزة.','Yes, all our sites are fully responsive.',2)
) as t(slug, q_ar, q_en, a_ar, a_en, sort)
on s.slug = t.slug
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Project categories
-- ---------------------------------------------------------------------------
insert into public.project_categories (id, name_ar, name_en, slug, sort) values
  ('20000000-0000-0000-0000-000000000001','مواقع إلكترونية','Websites','websites',1),
  ('20000000-0000-0000-0000-000000000002','متاجر إلكترونية','E-Commerce','e-commerce',2),
  ('20000000-0000-0000-0000-000000000003','برمجة مخصصة','Custom Development','custom-development',3),
  ('20000000-0000-0000-0000-000000000004','تطبيقات موبايل','Mobile Applications','mobile-applications',4),
  ('20000000-0000-0000-0000-000000000005','أنظمة ERP','ERP','erp',5),
  ('20000000-0000-0000-0000-000000000006','أنظمة POS','POS','pos',6),
  ('20000000-0000-0000-0000-000000000007','أنظمة CRM','CRM','crm',7),
  ('20000000-0000-0000-0000-000000000008','أنظمة أخرى','Other Systems','other-systems',8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Sample projects (clearly marked as demo data in title)
-- ---------------------------------------------------------------------------
insert into public.projects (id, title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, completion_date, technologies, status_field, sort, is_featured, published_at) values
  ('30000000-0000-0000-0000-000000000001','مثال: منصة تجارة إلكترونية','Demo: E-Commerce Platform','demo-ecommerce-platform',
   'متجر إلكتروني متكامل لواجهة عربية ثنائية اللغة.','A complete bilingual e-commerce storefront.',
   'مشروع تجريبي يعرض قدراتنا في بناء المتاجر الإلكترونية.','A demo project showcasing our e-commerce capabilities.',
   '10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',
   'completed','2025-01-15',array['Next.js','Supabase','Tailwind'],'published',1,true,now()),
  ('30000000-0000-0000-0000-000000000002','مثال: نظام إدارة موارد المؤسسات','Demo: Enterprise ERP System','demo-erp-system',
   'نظام ERP لإدارة المخزون والمحاسبة.','An ERP system for inventory and accounting.',
   'مشروع تجريبي يعرض قدراتنا في الأنظمة الإدارية.','A demo project showcasing our enterprise systems.',
   '10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005',
   'in_progress',null,array['React','Node.js','PostgreSQL'],'published',2,true,now()),
  ('30000000-0000-0000-0000-000000000003','مثال: تطبيق توصيل موبايل','Demo: Mobile Delivery App','demo-mobile-delivery-app',
   'تطبيق موبايل لإدارة عمليات التوصيل.','A mobile app for delivery operations.',
   'مشروع تجريبي يعرض قدراتنا في تطبيقات الموبايل.','A demo project showcasing our mobile app capabilities.',
   '10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004',
   'completed','2024-11-01',array['React Native','Firebase'],'published',3,true,now())
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------
insert into public.article_categories (id, name_ar, name_en, slug, sort) values
  ('40000000-0000-0000-0000-000000000001','أخبار الشركة','Company News','company-news',1),
  ('40000000-0000-0000-0000-000000000002','مقالات تقنية','Tech Articles','tech-articles',2),
  ('40000000-0000-0000-0000-000000000003','التحول الرقمي','Digital Transformation','digital-transformation',3)
on conflict (slug) do nothing;

insert into public.article_tags (id, name, slug) values
  ('50000000-0000-0000-0000-000000000001','تطوير مواقع','web-development'),
  ('50000000-0000-0000-0000-000000000002','SEO','seo'),
  ('50000000-0000-0000-0000-000000000003','تحول رقمي','digital-transformation')
on conflict (slug) do nothing;

insert into public.articles (id, title_ar, title_en, slug, excerpt_ar, excerpt_en, content_ar, content_en, category_id, status, published_at, is_featured) values
  ('60000000-0000-0000-0000-000000000001','مثال: لماذا يحتاج عملك إلى موقع إلكتروني احترافي؟','Demo: Why your business needs a professional website','demo-why-business-needs-website',
   'في العصر الرقمي، موقعك هو واجهة عملك الأولى.','In the digital age, your website is your first storefront.',
   '<h2>واجهة أعمالك الرقمية</h2><p>موقع إلكتروني احترافي يبني الثقة ويزيد المبيعات ويعزز حضورك الرقمي.</p>',
   '<h2>Your digital storefront</h2><p>A professional website builds trust, increases sales and strengthens your digital presence.</p>',
   '40000000-0000-0000-0000-000000000002','published',now(),true),
  ('60000000-0000-0000-0000-000000000002','مثال: كيف تختار نظام إدارة المتاجر المناسب؟','Demo: How to choose the right store management system','demo-choose-store-system',
   'دليل لاختيار نظام المتجر المناسب لعملك.','A guide to choosing the right store system.',
   '<h2>اختيار النظام المناسب</h2><p>اعرف احتياجاتك أولاً ثم قارن بين الخيارات المتاحة.</p>',
   '<h2>Choosing the right system</h2><p>Understand your needs first, then compare options.</p>',
   '40000000-0000-0000-0000-000000000002','published',now(),false)
on conflict (slug) do nothing;

insert into public.article_tag_relations (article_id, tag_id) values
  ('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002'),
  ('60000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Social links
-- ---------------------------------------------------------------------------
insert into public.social_links (platform, label, url, icon, is_active, sort) values
  ('facebook','Facebook','https://facebook.com/sitekoom','facebook',true,1),
  ('instagram','Instagram','https://instagram.com/sitekoom','instagram',true,2),
  ('linkedin','LinkedIn','https://linkedin.com/company/sitekoom','linkedin',true,3),
  ('x','X','https://x.com/sitekoom','twitter',true,4),
  ('youtube','YouTube','https://youtube.com/@sitekoom','youtube',true,5),
  ('tiktok','TikTok','https://tiktok.com/@sitekoom','tiktok',true,6)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Company info
-- ---------------------------------------------------------------------------
insert into public.company_info (id, about_ar, about_en, mission_ar, mission_en, vision_ar, vision_en, values_ar, values_en, why_ar, why_en) values
  (1,
   'سايتكم شركة أردنية متخصصة في الحلول الرقمية وتطوير المواقع والمتاجر الإلكترونية والبرمجة المخصصة وتطبيقات الموبايل والأنظمة الإدارية. نساعد الشركات والمؤسسات على التحول الرقمي بثقة.',
   'Sitekoom is a Jordanian company specialized in digital solutions, website and e-commerce development, custom software, mobile apps and administrative systems. We help businesses transform digitally with confidence.',
   'تقديم حلول رقمية عالية الجودة تحقق قيمة حقيقية لعملائنا وتنمّي أعمالهم.',
   'Delivering high-quality digital solutions that create real value for our clients and grow their businesses.',
   'أن نكون الشريك الرقمي الأول للشركات في المنطقة.',
   'To be the leading digital partner for businesses in the region.',
   '["الاحترافية","الابتكار","الشفافية","الجودة","الالتزام"]',
   '["Professionalism","Innovation","Transparency","Quality","Commitment"]',
   '[{"icon":"puzzle","title":"حلول مخصصة","description":"نصمم الحلول حسب احتياجك بالضبط"},{"icon":"shield-check","title":"أمان عالي","description":"نلتزم بأعلى معايير الأمان"},{"icon":"zap","title":"أداء عالي","description":"سرعة وكفاءة في كل منتج"},{"icon":"trending-up","title":"قابلية التوسع","description":"أنظمة تنمو مع أعمالك"}]',
   '[{"icon":"puzzle","title":"Custom Solutions","description":"We design solutions around your exact needs"},{"icon":"shield-check","title":"High Security","description":"We follow the highest security standards"},{"icon":"zap","title":"High Performance","description":"Speed and efficiency in every product"},{"icon":"trending-up","title":"Scalable","description":"Systems that grow with your business"}]'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Statistics
-- ---------------------------------------------------------------------------
insert into public.statistics (id, label_ar, label_en, value, suffix, icon, sort) values
  ('70000000-0000-0000-0000-000000000001','مشروع منجز','Projects Delivered',0,'+','folder-check',1),
  ('70000000-0000-0000-0000-000000000002','عميل سعيد','Happy Clients',0,'+','smile',2),
  ('70000000-0000-0000-0000-000000000003','سنوات خبرة','Years Experience',0,'','award',3),
  ('70000000-0000-0000-0000-000000000004','خدمة رقمية','Digital Services',8,'','layers',4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Homepage sliders
-- ---------------------------------------------------------------------------
insert into public.homepage_sliders (id, title_ar, title_en, subtitle_ar, subtitle_en, description_ar, description_en, cta_text_ar, cta_text_en, cta_url, cta2_text_ar, cta2_text_en, cta2_url, is_active, sort) values
  ('80000000-0000-0000-0000-000000000001',
   'نحوّل أفكارك إلى حلول رقمية','We turn your ideas into digital solutions',
   'شريكك الرقمي الموثوق','Your trusted digital partner',
   'نصمم ونطوّر مواقع ومتاجر وأنظمة إدارية تليق بعلامتك التجارية وتنمّي أعمالك.',
   'We design and develop websites, stores and enterprise systems that match your brand and grow your business.',
   'ابدأ مشروعك الآن','Start your project','/contact',
   'استكشف خدماتنا','Explore our services','/services', true, 1),
  ('80000000-0000-0000-0000-000000000002',
   'حلول برمجية مخصصة بمعايير عالمية','Custom software built to global standards',
   'من الفكرة إلى الإطلاق','From idea to launch',
   'نطوّر أنظمة ERP وPOS وCRM وتطبيقات موبايل مصممة خصيصاً لاحتياجات عملك.',
   'We develop ERP, POS, CRM and mobile apps tailored to your business needs.',
   'اطلب عرض سعر','Request a quote','/contact',
   'شاهد أعمالنا','View our work','/projects', true, 2)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Marquee messages
-- ---------------------------------------------------------------------------
insert into public.marquee_messages (id, text_ar, text_en, is_active, sort) values
  ('90000000-0000-0000-0000-000000000001','نحوّل أفكارك إلى حلول رقمية تنمو مع أعمالك','We turn your ideas into digital solutions that grow with your business',true,1),
  ('90000000-0000-0000-0000-000000000002','تصميم • تطوير • تحول رقمي','Design • Development • Digital Transformation',true,2),
  ('90000000-0000-0000-0000-000000000003','حلول متكاملة للشركات والمؤسسات','Complete solutions for businesses and enterprises',true,3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Homepage sections
-- ---------------------------------------------------------------------------
insert into public.homepage_sections (key, title_ar, title_en, description_ar, description_en, is_active, sort) values
  ('hero','','','','',true,1),
  ('marquee','','','','',true,2),
  ('services','خدماتنا','Our Services','نقدّم حلولاً رقمية متكاملة تناسب أعمالك.','We provide complete digital solutions for your business.',true,3),
  ('intro','من نحن','About Us','سايتكم شريكك الرقمي الموثوق في الأردن.','Sitekoom is your trusted digital partner in Jordan.',true,4),
  ('statistics','أرقامنا','Our Numbers','إنجازات نفخر بها.','Achievements we are proud of.',true,5),
  ('why','لماذا تختار سايتكم؟','Why Choose Sitekoom?','أسباب تجعلنا الخيار الأمثل لشريكك التقني.','Reasons that make us your ideal technology partner.',true,6),
  ('projects','أحدث أعمالنا','Latest Work','استكشف بعض مشاريعنا المميزة.','Explore some of our featured projects.',true,7),
  ('team','فريقنا','Our Team','خبرات تصنع الفرق.','Expertise that makes the difference.',true,8),
  ('cta','لديك فكرة؟ دعنا نحوّلها إلى مشروع ناجح.','Have an idea? Let''s turn it into a successful project.','','',true,9),
  ('contact','تواصل معنا','Contact Us','','',true,10)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Site settings (key/value jsonb)
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value, is_public) values
  ('general', '{
    "company_name_ar":"سايتكم",
    "company_name_en":"Sitekoom",
    "tagline_ar":"حلول رقمية تنمو مع أعمالك",
    "tagline_en":"Digital solutions that grow with your business",
    "email":"hello@sitekoom.com",
    "phone":"+962790000000",
    "whatsapp":"+962790000000",
    "whatsapp_message":"مرحباً سايتكم، أود الاستفسار عن خدماتكم",
    "address_ar":"عمّان، الأردن",
    "address_en":"Amman, Jordan",
    "google_maps_url":"https://maps.google.com/?q=Amman,Jordan",
    "working_hours_ar":"الأحد - الخميس: 9 صباحاً - 6 مساءً",
    "working_hours_en":"Sunday - Thursday: 9 AM - 6 PM",
    "logo":"",
    "favicon":""
  }'::jsonb, true),
  ('seo', '{
    "site_title":"سايتكم | حلول رقمية وتطوير مواقع ومتاجر في الأردن",
    "meta_description":"سايتكم شركة أردنية متخصصة في تطوير المواقع والمتاجر الإلكترونية والبرمجة المخصصة وتطبيقات الموبايل وأنظمة ERP وPOS وCRM.",
    "keywords":"تصميم مواقع الأردن, برمجة الأردن, متاجر إلكترونية, ERP Jordan, Web Development Jordan",
    "google_verification":"",
    "bing_verification":"",
    "analytics_id":"",
    "gtm_id":"",
    "default_og_image":""
  }'::jsonb, true),
  ('contact', '{
    "destination_email":"hello@sitekoom.com",
    "smtp_host":"",
    "smtp_port":587,
    "smtp_user":"",
    "smtp_pass":"",
    "smtp_secure":false,
    "auto_reply":true
  }'::jsonb, false),
  ('appearance', '{
    "primary_color":"#7a1aff",
    "secondary_color":"#9d72ff",
    "dark_mode":"system"
  }'::jsonb, true),
  ('integrations', '{
    "google_verification":"",
    "google_analytics_id":"",
    "google_tag_manager_id":"",
    "google_maps_url":"",
    "google_maps_api_key":""
  }'::jsonb, true),
  ('lead_statuses', '["new","contacted","in_progress","converted","closed","spam"]'::jsonb, true),
  ('lead_priorities', '["low","medium","high","urgent"]'::jsonb, true),
  ('project_statuses', '["in_progress","preparing","ready","maintenance","completed","paused"]'::jsonb, true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- SEO metadata for static pages (per locale)
-- ---------------------------------------------------------------------------
insert into public.seo_metadata (entity_type, entity_id, locale, seo_title, meta_description, keywords) values
  ('home', null, 'ar', 'سايتكم | حلول رقمية وتطوير مواقع ومتاجر في الأردن', 'شركة أردنية متخصصة في تطوير المواقع والمتاجر الإلكترونية والبرمجة المخصصة وتطبيقات الموبايل وأنظمة ERP وPOS وCRM.', array['تصميم مواقع الأردن','برمجة الأردن','متاجر إلكترونية الأردن']),
  ('home', null, 'en', 'Sitekoom | Web, E-Commerce & ERP Development in Jordan', 'A Jordanian company specialized in websites, e-commerce, custom software, mobile apps, ERP, POS and CRM systems.', array['Web Development Jordan','ERP Jordan','E-Commerce Jordan']),
  ('about', null, 'ar', 'من نحن | سايتكم', 'تعرّف على سايتكم، شركة الحلول الرقمية في الأردن.', array['شركة برمجة الأردن']),
  ('about', null, 'en', 'About Us | Sitekoom', 'Learn about Sitekoom, the digital solutions company in Jordan.', array['Software Company Jordan']),
  ('contact', null, 'ar', 'اتصل بنا | سايتكم', 'تواصل مع فريق سايتكم لبدء مشروعك الرقمي.', array[]::text[]),
  ('contact', null, 'en', 'Contact Us | Sitekoom', 'Get in touch with the Sitekoom team to start your digital project.', array[]::text[])
on conflict (entity_type, entity_id, locale) do nothing;
