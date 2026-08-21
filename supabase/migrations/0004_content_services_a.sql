-- ============================================================================
-- Sitekoom — Content population (Services 1-4)
-- Idempotent: upserts services, replaces features/faqs for known slugs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Service 1: Web Design & Development
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'web-development',
  'تصميم وتطوير المواقع الإلكترونية',
  'Web Design & Development',
  'globe',
  $c$نصمم ونطور مواقع إلكترونية سريعة، متجاوبة واحترافية تساعد الشركات والمؤسسات على بناء حضور رقمي قوي وتحويل الزوار إلى عملاء.$c$,
  $c$We design and develop fast, responsive and professional websites that help businesses build a strong digital presence and turn visitors into customers.$c$,
  $c$<p>في Sitekoom نساعد الشركات والمؤسسات على بناء مواقع إلكترونية احترافية تجمع بين التصميم الحديث، الأداء العالي وتجربة المستخدم السلسة.</p><p>نبدأ بفهم طبيعة نشاطك وأهدافك، ثم نحول هذه المتطلبات إلى تجربة رقمية مصممة خصيصًا لعلامتك التجارية. سواء كنت بحاجة إلى موقع شركة، منصة تعريفية، موقع خدمات، موقع مؤسسة أو منصة رقمية متقدمة، نقوم بتطوير الحل بما يتناسب مع احتياجاتك الحالية وقابلية التوسع مستقبلًا.</p><p>نهتم بكل تفاصيل المشروع بدءًا من تجربة المستخدم وتصميم الواجهات، مرورًا بالتطوير والربط مع الخدمات الخارجية، وصولًا إلى تحسين الأداء والأمان وتهيئة الموقع لمحركات البحث.</p><p>هدفنا ليس إنشاء موقع جميل فقط، بل إنشاء أداة رقمية تخدم أعمالك وتساعدك على الوصول إلى عملائك وتحقيق أهدافك.</p>$c$,
  $c$<p>At Sitekoom, we help businesses and organizations build professional digital experiences that combine modern design, high performance and seamless user experience.</p><p>We start by understanding your business, audience and objectives, then transform those requirements into a digital experience tailored to your brand.</p><p>Whether you need a corporate website, business website, service platform or a more advanced digital solution, we build scalable websites designed around your specific requirements.</p><p>From UX/UI design and development to integrations, performance optimization, security and SEO readiness, we take care of the complete digital experience.</p><p>Our goal is not simply to create a beautiful website. We build digital platforms that support your business, communicate your value and help you grow.</p>$c$,
  'published', 1, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;

-- ---------------------------------------------------------------------------
-- Service 2: E-Commerce
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'ecommerce',
  'المتاجر الإلكترونية',
  'E-Commerce Development',
  'shopping-cart',
  $c$نبني متاجر إلكترونية احترافية تساعدك على بيع منتجاتك وإدارة عملياتك وتنمية مبيعاتك.$c$,
  $c$We build scalable e-commerce stores designed to sell, convert and grow with your business.$c$,
  $c$<p>نطور في Sitekoom متاجر إلكترونية متكاملة مصممة لتقديم تجربة شراء سهلة وسريعة وآمنة.</p><p>نبدأ من هيكلة المنتجات والتصنيفات وتجربة المستخدم، وصولًا إلى الدفع والشحن وإدارة الطلبات والمخزون والعملاء والتسويق.</p><p>يمكن بناء المتجر بما يتناسب مع حجم نشاطك، سواء كنت تبدأ مشروعًا إلكترونيًا جديدًا أو تريد تطوير متجر قائم وتحسين أدائه.</p><p>نركز على أن يكون المتجر سهل الإدارة من جهة، ومريحًا للعملاء من جهة أخرى، مع إمكانية إضافة خصائص وتكاملات جديدة مستقبلًا.</p>$c$,
  $c$<p>At Sitekoom, we create complete e-commerce experiences designed around your products, customers and business model.</p><p>From product architecture and UX to payments, shipping, inventory, orders and customer management, we build the complete digital commerce ecosystem.</p><p>Our stores are designed to be easy to manage while providing customers with a fast, secure and seamless shopping experience.</p>$c$,
  'published', 2, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;

-- ---------------------------------------------------------------------------
-- Service 3: Custom Software
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'custom-software',
  'البرمجة والتطوير المخصص',
  'Custom Software Development',
  'code',
  $c$نحوّل الأفكار والمتطلبات المعقدة إلى منصات وأنظمة رقمية مصممة خصيصًا لعملك.$c$,
  $c$We turn complex business requirements and ideas into scalable software built around your workflow.$c$,
  $c$<p>عندما لا يكون الحل الجاهز مناسبًا لطبيعة عملك، تحتاج إلى نظام مصمم حول عملياتك أنت.</p><p>في Sitekoom نطور حلولًا وبرمجيات مخصصة تبدأ من تحليل احتياجات العمل وتنتهي بنظام متكامل قابل للتوسع.</p><p>يمكننا بناء منصات SaaS، أنظمة داخلية، بوابات إلكترونية، APIs، لوحات تحكم، أنظمة حجز، منصات متعددة المستخدمين وغيرها من الحلول الرقمية.</p>$c$,
  $c$<p>When off-the-shelf software cannot properly support your business, a custom solution can provide the flexibility you need.</p><p>At Sitekoom, we design and develop custom digital platforms around your processes, users and business objectives.</p><p>From SaaS platforms and internal systems to dashboards, APIs, booking platforms and multi-user applications, we build solutions that can evolve with your organization.</p>$c$,
  'published', 3, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;

-- ---------------------------------------------------------------------------
-- Service 4: Mobile Apps
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'mobile-apps',
  'تطوير تطبيقات الموبايل',
  'Mobile App Development',
  'smartphone',
  $c$نطور تطبيقات موبايل حديثة وسريعة لأنظمة Android وiOS مع تجربة استخدام مصممة حول المستخدم.$c$,
  $c$We build modern, high-performance mobile applications for Android and iOS with user-focused experiences.$c$,
  $c$<p>نساعد الشركات ورواد الأعمال على تحويل أفكارهم إلى تطبيقات موبايل عملية واحترافية.</p><p>نقوم بتطوير التطبيقات من مرحلة الفكرة والتخطيط، مرورًا بتصميم تجربة المستخدم والواجهات، وصولًا إلى البرمجة والاختبار والنشر.</p><p>يمكن تطوير تطبيقات للعملاء، التطبيقات الداخلية، منصات الخدمات، الحجوزات، التجارة الإلكترونية، التوصيل وغيرها.</p>$c$,
  $c$<p>We help businesses and entrepreneurs transform ideas into practical and engaging mobile applications.</p><p>From discovery and UX/UI design to development, testing and deployment, we handle the complete application development lifecycle.</p><p>We can build customer apps, internal business applications, booking platforms, e-commerce applications, delivery solutions and more.</p>$c$,
  'published', 4, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;
