-- ============================================================================
-- Sitekoom — Portfolio works (20 real WordPress/WooCommerce projects)
-- Safe & idempotent: upserts categories, services, projects (by slug) and SEO
-- metadata (by entity). Never touches thumbnail/cover_image/project_url, so
-- existing images and screenshots are preserved.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Reusable project categories
-- ---------------------------------------------------------------------------
insert into public.project_categories (name_ar, name_en, slug, sort) values
  ('مواقع تعريفية','Corporate Websites','corporate-websites',1),
  ('مواقع الشركات','Corporate Websites','corporate-companies',2),
  ('مواقع طبية','Healthcare Websites','healthcare-websites',3),
  ('مواقع تعليمية','Educational Websites','educational-websites',4),
  ('مواقع المؤسسات والجمعيات','Organization & NGO Websites','ngo-websites',5),
  ('مواقع المستشفيات والقطاع الطبي','Hospital & Healthcare Websites','hospital-websites',6),
  ('متاجر إلكترونية','eCommerce','ecommerce-stores',7),
  ('مواقع العيادات','Medical Clinic Websites','medical-clinic-websites',8),
  ('مواقع المؤسسات المالية','Financial & Organization Websites','financial-websites',9),
  ('مواقع الشركات الصناعية','Industrial Corporate Websites','industrial-corporate-websites',10),
  ('مواقع الشركات التقنية','Technology Corporate Websites','technology-websites',11),
  ('مواقع الأمن السيبراني','Cybersecurity Websites','cybersecurity-websites',12),
  ('مواقع الشركات الصناعية','Industrial Websites','industrial-websites',13),
  ('مواقع طبية وصيدلانية','Healthcare & Pharmacy Websites','pharmacy-websites',14),
  ('مواقع سياحية وحجوزات','Tourism & Travel Websites','tourism-websites',15),
  ('مواقع الشركات والاستشارات','Consulting & Corporate Websites','consulting-websites',16)
on conflict (slug) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- Reusable services
-- ---------------------------------------------------------------------------
insert into public.services (title_ar, title_en, slug, icon, status, sort) values
  ('تصميم وتطوير مواقع إلكترونية','Website Design & Development','website-design-development','globe','published',1),
  ('تصميم وتطوير مواقع طبية','Healthcare Website Development','healthcare-website-development','heart-handshake','published',2),
  ('تصميم مواقع طبية','Medical Website Development','medical-website-development','shield-check','published',3),
  ('تصميم وتطوير مواقع المؤسسات','Corporate & Organization Website Development','organization-website-development','globe','published',4),
  ('تصميم مواقع الشركات الصناعية','Industrial Corporate Website Development','industrial-corporate-website-development','settings','published',5),
  ('تصميم مواقع المستشفيات','Hospital Website Development','hospital-website-development','shield-check','published',6),
  ('تصميم وتطوير متجر إلكتروني','eCommerce Development','ecommerce-development','shopping-cart','published',7),
  ('تصميم مواقع المؤسسات','Corporate Website Development','corporate-website-development','globe','published',8),
  ('تصميم وتطوير متجر تجميل إلكتروني','Beauty eCommerce Development','beauty-ecommerce-development','shopping-cart','published',9),
  ('تصميم مواقع شركات التقنية والذكاء الاصطناعي','Technology Website Development','technology-website-development','bot','published',10),
  ('تصميم مواقع شركات التقنية والأمن السيبراني','Cybersecurity Website Development','cybersecurity-website-development','shield-check','published',11),
  ('تصميم مواقع الشركات الصناعية','Industrial Website Development','industrial-website-development','settings','published',12),
  ('تصميم وتطوير متجر عطور إلكتروني','Fragrance eCommerce Development','fragrance-ecommerce-development','shopping-cart','published',13),
  ('تصميم مواقع شركات الرعاية الصحية','Healthcare Website Development','healthcare-company-website-development','heart-handshake','published',14),
  ('تصميم وتطوير مواقع السياحة والسفر','Tourism Website Development','tourism-website-development','globe','published',15),
  ('تصميم وتطوير مواقع الأطباء والعيادات','Doctor & Clinic Website Development','doctor-clinic-website-development','heart-handshake','published',16),
  ('تصميم مواقع شركات الاستشارات','Consulting Website Development','consulting-website-development','lightbulb','published',17)
on conflict (slug) do update set title_ar = excluded.title_ar, title_en = excluded.title_en, icon = excluded.icon, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- Projects (upsert by slug). Image fields (thumbnail/cover_image/project_url)
-- are intentionally NOT overwritten so existing screenshots are preserved.
-- ---------------------------------------------------------------------------

-- 1. Yassmin Abu Hadba Law
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('شركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية','Yassmin Abu Hadba Law & Legal Consultancy','yassmin-abu-hadba-law',
   $p$موقع إلكتروني تعريفي احترافي لشركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية، يعرض الخدمات والتخصصات القانونية وفريق العمل وطرق التواصل.$p$,
   $p$A professional corporate website for Yassmin Abu Hadba Law & Legal Consultancy, showcasing legal services, expertise, team members, and contact information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لشركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية. يهدف الموقع إلى تقديم الشركة وخدماتها القانونية بطريقة واضحة واحترافية للعملاء والزوار. يتضمن الموقع أقسامًا للتعريف بالشركة ومجالات الاختصاص والخدمات والاستشارات القانونية. كما تم تصميم أقسام لعرض فريق العمل وآراء العملاء ومعلومات التواصل وموقع المكتب. تم بناء الموقع باستخدام WordPress مع تصميم متجاوب وتجربة استخدام مناسبة لمختلف الأجهزة.$p$,
   $p$A professional corporate website was developed for Yassmin Abu Hadba Law & Legal Consultancy. The website presents the firm, its legal services, areas of expertise, and professional capabilities. Dedicated sections showcase the legal team, services, client testimonials, and company information. The website also provides clear contact information and an easy way for visitors to reach the firm. Built with WordPress and a responsive custom interface optimized for desktop, tablet, and mobile devices.$p$,
   (select id from public.services where slug='website-design-development'),
   (select id from public.project_categories where slug='corporate-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Web Design','SEO'], 'published', 1, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 2. Al Sakha Academy
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('أكاديمية السخاء للتدريب والتعليم الطبي','Al Sakha Academy – Medical Training & Education','al-sakha-academy',
   $p$موقع إلكتروني تعريفي وتعليمي لأكاديمية السخاء، يعرض الدورات والبرامج التدريبية والخدمات التعليمية ومعلومات الأكاديمية.$p$,
   $p$An educational and corporate website for Al Sakha Academy, showcasing training programs, courses, educational services, and academy information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي وتعليمي لأكاديمية السخاء المتخصصة في التدريب والتعليم الطبي. يعرض الموقع البرامج والدورات التدريبية والخدمات التعليمية التي تقدمها الأكاديمية. تم تنظيم المحتوى بطريقة تسهّل على الزائر التعرف على الدورات والخدمات ومعلومات الأكاديمية. كما يتضمن الموقع أقسامًا للأخبار والمحتوى التعليمي ومعلومات التواصل والتعريف بالأكاديمية. تم بناء الموقع باستخدام WordPress مع تصميم متجاوب وتجربة استخدام مناسبة للطلاب والزوار.$p$,
   $p$A professional educational website was developed for Al Sakha Academy. The website presents the academy's medical training programs, courses, and educational services. Content is organized to help visitors easily explore available programs and learn more about the academy. Additional sections provide academy information, educational content, news, and contact details. The website was built with WordPress using a responsive interface for desktop, tablet, and mobile users.$p$,
   (select id from public.services where slug='website-design-development'),
   (select id from public.project_categories where slug='educational-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 2, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 3. Al Sakha Home Healthcare
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('السخاء للرعاية الصحية المنزلية','Al Sakha Home Healthcare','al-sakha-home-healthcare',
   $p$موقع إلكتروني تعريفي لخدمات الرعاية الصحية المنزلية، يعرض الخدمات الطبية والفريق الصحي ومميزات الرعاية المنزلية.$p$,
   $p$A professional website for Al Sakha Home Healthcare, presenting home healthcare services, medical teams, and care solutions.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي متخصص في خدمات الرعاية الصحية المنزلية. يعرض الموقع مجموعة الخدمات الطبية والرعاية التي يمكن تقديمها للمرضى داخل المنزل. تم تصميم أقسام واضحة للخدمات والكوادر الطبية ومميزات الرعاية الصحية المنزلية. كما يتضمن الموقع معلومات عن المؤسسة وآراء العملاء وطرق التواصل وطلب الخدمة. تم بناء الموقع باستخدام WordPress بتصميم طبي متجاوب وسهل الاستخدام.$p$,
   $p$A professional healthcare website was developed for Al Sakha Home Healthcare. The website presents home healthcare services and solutions designed for patients and families. Dedicated sections highlight medical services, healthcare professionals, and the benefits of home care. The website also includes company information, testimonials, contact details, and service inquiry options. Built with WordPress using a responsive healthcare-focused interface.$p$,
   (select id from public.services where slug='healthcare-website-development'),
   (select id from public.project_categories where slug='healthcare-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 3, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 4. Eftekhar Therapeutic Services
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('افتخار للخدمات العلاجية','Eftekhar Therapeutic Services','eftekhar-therapeutic-services',
   $p$موقع إلكتروني تعريفي لمؤسسة متخصصة في الخدمات العلاجية والطبية، يعرض الخدمات والتخصصات والكوادر وطرق التواصل.$p$,
   $p$A professional healthcare website for Eftekhar Therapeutic Services, showcasing medical services, expertise, and contact information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لمؤسسة افتخار للخدمات العلاجية. يقدم الموقع صورة واضحة عن الخدمات العلاجية والتخصصات والخبرات التي توفرها المؤسسة. تم تصميم أقسام مرئية لعرض الخدمات والمحتوى الطبي والصور والمعلومات التعريفية. كما يضم الموقع أقسامًا للتعريف بالكوادر والخدمات وطرق التواصل والاستفسار. تم بناء الموقع باستخدام WordPress مع تصميم متجاوب يركز على سهولة الاستخدام.$p$,
   $p$A professional website was developed for Eftekhar Therapeutic Services. The website introduces the organization and highlights its therapeutic and healthcare services. Visual sections were designed to present services, medical information, imagery, and professional expertise. The website also includes contact and inquiry sections for potential clients and visitors. Built with WordPress using a responsive and modern healthcare-oriented design.$p$,
   (select id from public.services where slug='medical-website-development'),
   (select id from public.project_categories where slug='healthcare-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 4, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 5. Women Empowerment Support Association
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('جمعية دعم تمكين المرأة','Women Empowerment Support Association','women-empowerment-support-association',
   $p$موقع إلكتروني تعريفي لجمعية تهدف إلى دعم وتمكين المرأة، يعرض المبادرات والمشاريع والبرامج والأنشطة.$p$,
   $p$A nonprofit corporate website for a women empowerment association, showcasing initiatives, projects, programs, activities, and community work.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي لجمعية متخصصة في دعم وتمكين المرأة. يعرض الموقع أهداف الجمعية ومبادراتها وبرامجها والمشاريع والأنشطة التي تنفذها. تم إنشاء أقسام لعرض فريق العمل والأخبار والدراسات والمحتوى الخاص بالجمعية. كما يتضمن الموقع معارض للصور والفيديو ومعلومات التواصل وموقع الجمعية. تم بناء الموقع باستخدام WordPress مع تنظيم المحتوى بطريقة تسهّل وصول الزوار للمعلومات.$p$,
   $p$A professional nonprofit website was developed for a women empowerment association. The website presents the association's mission, initiatives, programs, projects, and community activities. Dedicated sections showcase team members, news, studies, events, and organizational content. The website also includes photo and video galleries, contact information, and location details. Built with WordPress using a responsive structure focused on accessibility and clear content presentation.$p$,
   (select id from public.services where slug='organization-website-development'),
   (select id from public.project_categories where slug='ngo-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 5, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 6. MASS
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('MASS لأنظمة الألمنيوم والحديد الحديثة','MASS – Modern Aluminum & Steel Systems','mass-aluminum-steel-systems',
   $p$موقع إلكتروني تعريفي لشركة متخصصة في أنظمة الألمنيوم والحديد والواجهات، مع عرض المنتجات والمشاريع والخدمات.$p$,
   $p$A professional corporate website for MASS, showcasing modern aluminum and steel systems, products, services, and completed projects.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لشركة MASS المتخصصة في أنظمة الألمنيوم والحديد الحديثة. يعرض الموقع خدمات الشركة ومنتجاتها ومجالات العمل والحلول الهندسية التي توفرها. تم إنشاء معرض خاص لعرض المشاريع السابقة والمنتجات مع صور توضيحية. كما يتضمن الموقع قسمًا لآراء العملاء والأسئلة الشائعة ونموذجًا لطلب عرض سعر. تم بناء الموقع باستخدام WordPress مع تصميم احترافي متجاوب يعكس الهوية الصناعية للشركة.$p$,
   $p$A professional corporate website was developed for MASS – Modern Aluminum & Steel Systems. The website showcases the company's aluminum and steel systems, products, services, and engineering solutions. A dedicated portfolio section presents completed projects and product applications through visual content. The website also includes testimonials, FAQs, contact information, and a quote request form. Built with WordPress using a responsive corporate design tailored to the industrial sector.$p$,
   (select id from public.services where slug='industrial-corporate-website-development'),
   (select id from public.project_categories where slug='corporate-companies'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 6, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 7. Al Sakha Hospital
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('مستشفى السخاء – الرعاية الصحية المتكاملة','Al Sakha Hospital – Integrated Healthcare','al-sakha-hospital',
   $p$موقع إلكتروني تعريفي لمؤسسة ومستشفى طبي، يعرض الخدمات الطبية والأطباء والأقسام والمرافق والمعلومات الصحية.$p$,
   $p$A professional hospital website showcasing medical services, departments, healthcare professionals, facilities, and patient information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لمؤسسة صحية تقدم خدمات الرعاية الطبية المتكاملة. يعرض الموقع الخدمات الطبية والتخصصات والأقسام والكوادر الصحية بطريقة منظمة. تم تصميم أقسام خاصة للأطباء والخدمات والمرافق الطبية ومعرض الصور والأخبار. كما يتضمن الموقع الأسئلة الشائعة وآراء المرضى ومعلومات التواصل وموقع المستشفى. تم بناء الموقع باستخدام WordPress مع تصميم متجاوب وتجربة استخدام مناسبة للمواقع الصحية.$p$,
   $p$A professional healthcare website was developed for Al Sakha Hospital. The website presents medical services, departments, healthcare professionals, and hospital facilities. Dedicated sections showcase doctors, services, medical imagery, news, and organizational information. It also includes FAQs, patient testimonials, contact information, and hospital location details. Built with WordPress using a responsive healthcare-focused interface.$p$,
   (select id from public.services where slug='hospital-website-development'),
   (select id from public.project_categories where slug='hospital-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 7, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 8. Pet Mall
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('Pet Mall – متجر مستلزمات الحيوانات الأليفة','Pet Mall – Pet Supplies Online Store','pet-mall',
   $p$متجر إلكتروني متكامل لبيع مستلزمات الحيوانات الأليفة، مع تصنيفات للمنتجات والعروض والمنتجات الجديدة والأكثر مبيعًا.$p$,
   $p$A complete online pet supplies store featuring product categories, offers, new arrivals, best sellers, and an online shopping experience.$p$,
   $p$تم تطوير متجر إلكتروني متخصص في بيع مستلزمات ومنتجات الحيوانات الأليفة. يعرض المتجر المنتجات ضمن تصنيفات واضحة تساعد العملاء على الوصول إلى احتياجاتهم بسهولة. تم استخدام WooCommerce لإدارة المنتجات والأسعار والسلة والطلبات والعمليات الشرائية. كما يتضمن المتجر أقسامًا للعروض والمنتجات الجديدة والأكثر مبيعًا وآراء العملاء. تم تصميم المتجر ليكون متجاوبًا وسهل الاستخدام على الهاتف والتابلت والكمبيوتر.$p$,
   $p$A complete eCommerce website was developed for Pet Mall, specializing in pet supplies and products. The store organizes products into clear categories to make shopping easier for pet owners. WooCommerce is used to manage products, pricing, cart functionality, orders, and the purchasing process. The website also features promotions, new arrivals, best-selling products, and customer reviews. The store was designed to provide a smooth and responsive shopping experience across all devices.$p$,
   (select id from public.services where slug='ecommerce-development'),
   (select id from public.project_categories where slug='ecommerce-stores'),
   'completed', array['WordPress','WooCommerce','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 8, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 9. Dr. Hamzah Bahaa Al-Din Clinic
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('عيادة د. حمزة بهاء الدين','Dr. Hamzah Bahaa Al-Din Clinic','dr-hamzah-bahaa-al-din-clinic',
   $p$موقع إلكتروني تعريفي لعيادة طبية يعرض الطبيب وخبراته والخدمات الطبية والصور ومعلومات التواصل.$p$,
   $p$A professional medical clinic website presenting the doctor, expertise, medical services, gallery, and contact information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لعيادة الدكتور حمزة بهاء الدين. يقدم الموقع نبذة عن الطبيب وخبراته والخدمات والتخصصات الطبية التي يقدمها. تم إنشاء أقسام لعرض الخدمات والصور والفيديوهات والشهادات وآراء المراجعين. كما يوفر الموقع معلومات واضحة عن موقع العيادة وطرق التواصل والوصول إليها. تم بناء الموقع باستخدام WordPress مع تصميم طبي متجاوب وسهل الاستخدام.$p$,
   $p$A professional medical website was developed for Dr. Hamzah Bahaa Al-Din Clinic. The website introduces the doctor, his expertise, and the medical services offered. Dedicated sections showcase services, images, videos, certificates, and patient testimonials. Clear contact and location information helps patients easily reach the clinic. The website was built with WordPress using a responsive medical-focused design.$p$,
   (select id from public.services where slug='medical-website-development'),
   (select id from public.project_categories where slug='medical-clinic-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 9, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 10. MIFM
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('المؤسسة الإسلامية للتمويل والتنمية – MIFM','MIFM – Islamic Financing & Development','mifm-islamic-financing-development',
   $p$موقع إلكتروني تعريفي لمؤسسة متخصصة في التمويل والتنمية، يعرض البرامج والخدمات والمشاريع والشركاء.$p$,
   $p$A professional corporate website for MIFM, presenting financing programs, development services, projects, partners, and organizational information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي للمؤسسة الإسلامية للتمويل والتنمية. يعرض الموقع الخدمات والبرامج التمويلية والمشاريع والمبادرات التي تقدمها المؤسسة. تم تنظيم المعلومات بطريقة واضحة تساعد المستفيدين على التعرف على البرامج والخدمات. كما يتضمن الموقع أقسامًا للمشاريع والشركاء والأخبار والمعلومات المؤسسية. تم بناء الموقع باستخدام WordPress مع تصميم احترافي متجاوب.$p$,
   $p$A professional corporate website was developed for MIFM – Islamic Financing & Development. The website presents financing programs, development services, projects, and organizational initiatives. Information is structured to help visitors understand available programs and services. Dedicated sections showcase projects, partners, news, and organizational information. Built with WordPress using a responsive corporate design.$p$,
   (select id from public.services where slug='corporate-website-development'),
   (select id from public.project_categories where slug='financial-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 10, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 11. ZERO Cosmetics
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('ZERO Cosmetics – متجر مستحضرات التجميل','ZERO Cosmetics – Beauty & Skincare Store','zero-cosmetics',
   $p$متجر إلكتروني متخصص في مستحضرات التجميل والعناية بالبشرة والشعر، مع تصنيفات للمنتجات والعلامات التجارية والعروض.$p$,
   $p$An online beauty and skincare store featuring cosmetics, skincare, haircare products, brands, categories, and promotional offers.$p$,
   $p$تم تطوير متجر إلكتروني احترافي لعلامة ZERO Cosmetics المتخصصة في مستحضرات التجميل والعناية. يعرض المتجر المنتجات ضمن تصنيفات واضحة تشمل العناية بالبشرة والشعر والمكياج وغيرها. تم استخدام WooCommerce لإدارة المنتجات والأسعار والسلة والطلبات والعمليات الشرائية. كما يتضمن الموقع أقسامًا للعلامات التجارية والعروض والمنتجات الجديدة والأكثر مبيعًا. تم تصميم المتجر بواجهة عصرية ومتجاوبة توفر تجربة شراء سهلة على مختلف الأجهزة.$p$,
   $p$A professional eCommerce store was developed for ZERO Cosmetics. The store showcases cosmetics, skincare, haircare, makeup, and beauty products through organized categories. WooCommerce manages products, pricing, shopping cart functionality, orders, and the purchasing workflow. The website also includes brand sections, promotions, new arrivals, and best-selling products. The store features a modern responsive interface designed for a smooth shopping experience.$p$,
   (select id from public.services where slug='beauty-ecommerce-development'),
   (select id from public.project_categories where slug='ecommerce-stores'),
   'completed', array['WordPress','WooCommerce','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 11, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 12. Sigma Detergents
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('سيجما للمنظفات – Sigma Detergents','Sigma Detergents – Cleaning Products','sigma-detergents',
   $p$موقع إلكتروني تعريفي لشركة متخصصة في صناعة وتوريد منتجات المنظفات، يعرض المنتجات والأسواق والخدمات ومعلومات الشركة.$p$,
   $p$A professional corporate website for Sigma Detergents, showcasing cleaning products, markets, services, and company information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لشركة Sigma Detergents المتخصصة في منتجات التنظيف. يعرض الموقع نبذة عن الشركة وخبرتها ومنتجاتها وحلول التنظيف التي تقدمها. تم تصميم أقسام خاصة للمنتجات والتصنيفات والأسواق والعملاء والشركاء. كما يبرز الموقع الهوية الصناعية للشركة وقدراتها وخبرتها في مجال المنظفات. تم بناء الموقع باستخدام WordPress مع تصميم مؤسسي متجاوب.$p$,
   $p$A professional corporate website was developed for Sigma Detergents. The website introduces the company, its experience, cleaning products, and solutions. Dedicated sections showcase products, categories, markets, clients, and business partners. The design emphasizes the company's industrial identity and expertise in the cleaning products sector. Built with WordPress using a responsive corporate interface.$p$,
   (select id from public.services where slug='corporate-website-development'),
   (select id from public.project_categories where slug='industrial-corporate-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 12, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 13. Mentalyze AI
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('Mentalyze AI – حلول الأعمال والذكاء الاصطناعي','Mentalyze AI – Business & AI Solutions','mentalyze-ai',
   $p$موقع إلكتروني تعريفي لشركة تقدم الاستشارات والتوظيف والاستعانة بالمصادر وتطوير البرمجيات وحلول الذكاء الاصطناعي.$p$,
   $p$A corporate website for Mentalyze AI showcasing consulting, recruitment, outsourcing, software development, and AI solutions.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي حديث لشركة Mentalyze AI المتخصصة في حلول الأعمال والتقنية. يعرض الموقع خدمات الاستشارات والتوظيف والاستعانة بالمصادر وتطوير البرمجيات والذكاء الاصطناعي. تم تنظيم الخدمات والقطاعات المستهدفة بطريقة تساعد الشركات على فهم الحلول المقدمة. كما يتضمن الموقع أقسامًا للتعريف بالشركة ومجالات الخبرة وطريقة العمل والتواصل. تم بناء الموقع باستخدام WordPress مع تصميم تقني حديث ومتجاوب.$p$,
   $p$A modern corporate website was developed for Mentalyze AI. The website showcases consulting, recruitment, outsourcing, software development, and AI solutions. Services and industries are structured clearly to help businesses understand the company's capabilities. The website also presents company expertise, working approach, service areas, and contact options. Built with WordPress using a modern technology-focused responsive design.$p$,
   (select id from public.services where slug='technology-website-development'),
   (select id from public.project_categories where slug='technology-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 13, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 14. Code Strength
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('Code Strength – الأمن السيبراني والحلول التقنية','Code Strength – Cybersecurity & IT Solutions','code-strength',
   $p$موقع إلكتروني تعريفي لشركة متخصصة في الأمن السيبراني والبنية التحتية التقنية وإدارة المخاطر والامتثال.$p$,
   $p$A professional cybersecurity website presenting IT security, infrastructure, risk management, compliance, and technology solutions.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لشركة Code Strength المتخصصة في الأمن السيبراني. يعرض الموقع حلول الأمن السيبراني والبنية التحتية التقنية وإدارة المخاطر والامتثال. تم تنظيم الخدمات ضمن أقسام واضحة تشمل الحماية والإدارة والتقييم والحلول التقنية. كما يتضمن الموقع مراحل العمل ودراسات الحالات ونموذجًا لطلب الاستشارة والتواصل. تم بناء الموقع باستخدام WordPress مع تصميم تقني متجاوب يعكس طبيعة خدمات الأمن السيبراني.$p$,
   $p$A professional cybersecurity website was developed for Code Strength. The website presents cybersecurity, IT infrastructure, risk management, compliance, and security solutions. Services are organized into clear sections covering protection, management, assessment, and technical solutions. The website also includes service workflows, case studies, consultation requests, and contact information. Built with WordPress using a responsive technology-focused design.$p$,
   (select id from public.services where slug='cybersecurity-website-development'),
   (select id from public.project_categories where slug='cybersecurity-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 14, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 15. Al Zawraa Engineering Industries
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('شركة الزوراء للصناعات الهندسية','Al Zawraa Engineering Industries','al-zawraa-engineering-industries',
   $p$موقع إلكتروني تعريفي لشركة صناعية متخصصة في المعدات والمنتجات الهندسية، يعرض الخدمات والمنتجات والمشاريع والأسواق.$p$,
   $p$A corporate website for an engineering and industrial company showcasing products, services, projects, markets, and company capabilities.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لشركة الزوراء للصناعات الهندسية. يعرض الموقع المنتجات والخدمات والحلول الهندسية التي تقدمها الشركة لمختلف القطاعات. تم إنشاء أقسام خاصة للخدمات والمنتجات والمشاريع والعملاء والأسواق المستهدفة. كما يتضمن الموقع معرضًا للأعمال والصور ومعلومات التواصل والاستفسارات. تم بناء الموقع باستخدام WordPress مع تصميم صناعي متجاوب.$p$,
   $p$A professional corporate website was developed for Al Zawraa Engineering Industries. The website showcases engineering products, services, solutions, projects, and business capabilities. Dedicated sections present the company's markets, products, services, and completed work. The website also includes image galleries, company information, contact details, and inquiries. Built with WordPress using a responsive industrial corporate design.$p$,
   (select id from public.services where slug='industrial-website-development'),
   (select id from public.project_categories where slug='industrial-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 15, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 16. BENZ Perfume
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('BENZ Perfume – متجر العطور','BENZ Perfume – Online Fragrance Store','benz-perfume',
   $p$متجر إلكتروني متخصص في العطور، يعرض المنتجات حسب الفئات مع أقسام للعروض والأكثر طلبًا والعطور الرجالية والنسائية.$p$,
   $p$An online fragrance store offering perfumes organized by categories, with sections for offers, best sellers, men's and women's fragrances.$p$,
   $p$تم تطوير متجر إلكتروني متخصص في بيع العطور ومنتجات العناية والعطور الرجالية والنسائية. يعرض المتجر المنتجات ضمن تصنيفات واضحة تساعد العملاء على اختيار المنتجات المناسبة. تم استخدام WooCommerce لإدارة المنتجات والأسعار والسلة والطلبات والعمليات الشرائية. كما يتضمن المتجر أقسامًا للعروض والأكثر طلبًا والمنتجات المخصصة للرجال والنساء. تم تصميم المتجر بواجهة بسيطة وعصرية ومتجاوبة مع جميع الأجهزة.$p$,
   $p$A professional eCommerce website was developed for BENZ Perfume. The store offers fragrances organized into clear categories for men's and women's products. WooCommerce manages products, pricing, cart functionality, orders, and the online purchasing workflow. The store also features promotions, best-selling products, and dedicated product categories. The website uses a modern responsive interface designed for a smooth shopping experience.$p$,
   (select id from public.services where slug='fragrance-ecommerce-development'),
   (select id from public.project_categories where slug='ecommerce-stores'),
   'completed', array['WordPress','WooCommerce','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 16, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 17. KSA Meds
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('KSA Meds – الصيدلة والأدوية المتخصصة','KSA Meds – Specialty Pharmacy Services','ksa-meds',
   $p$موقع إلكتروني تعريفي متخصص في خدمات الصيدلة والأدوية والمستحضرات الطبية، يعرض الخدمات والمزايا ومعلومات الشركة.$p$,
   $p$A professional pharmacy website presenting specialty medication services, pharmacy solutions, company information, and healthcare capabilities.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي متخصص في مجال الصيدلة والأدوية والمستحضرات الطبية. يعرض الموقع الخدمات الدوائية ومزايا الشركة وآلية تقديم الخدمات للجهات والعملاء. تم تصميم أقسام للتعريف بالشركة والخدمات والمزايا والالتزام بالمعايير المهنية. كما يوضح الموقع طبيعة الخدمات والقطاعات المستفيدة ومعلومات التواصل. تم بناء الموقع باستخدام WordPress مع تصميم احترافي متجاوب.$p$,
   $p$A professional website was developed for KSA Meds in the specialty pharmacy sector. The website presents medication services, pharmacy solutions, company capabilities, and healthcare information. Dedicated sections explain the company's services, advantages, professional standards, and target clients. The website also provides clear company and contact information. Built with WordPress using a responsive healthcare and pharmaceutical design.$p$,
   (select id from public.services where slug='healthcare-company-website-development'),
   (select id from public.project_categories where slug='pharmacy-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 17, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 18. Sabarini Travel
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('Sabarini Travel – السياحة والرحلات في الأردن','Sabarini Travel – Jordan Tours & Travel','sabarini-travel',
   $p$موقع إلكتروني سياحي يعرض الوجهات والرحلات والباقات السياحية في الأردن، مع إمكانية الاستفسار والتخطيط للرحلات.$p$,
   $p$A tourism website showcasing Jordan destinations, tours, travel packages, and trip planning services.$p$,
   $p$تم تطوير موقع إلكتروني سياحي متخصص في تقديم التجارب والرحلات السياحية في الأردن. يعرض الموقع الوجهات السياحية والباقات والجولات والبرامج التي يمكن للزوار الاختيار منها. تم تصميم أقسام خاصة للوجهات والرحلات والخدمات السياحية والمعلومات المهمة للمسافر. كما يتضمن الموقع وسائل للتواصل والاستفسار وتخطيط الرحلات وطلب البرامج السياحية. تم بناء الموقع باستخدام WordPress مع تصميم سياحي متجاوب وتجربة تصفح سهلة.$p$,
   $p$A professional tourism website was developed for Sabarini Travel. The website showcases Jordanian destinations, tours, travel packages, and curated travel experiences. Dedicated sections present destinations, packages, tour options, travel services, and essential travel information. Visitors can explore trips, contact the company, request information, and plan their travel experience. Built with WordPress using a responsive tourism-focused design.$p$,
   (select id from public.services where slug='tourism-website-development'),
   (select id from public.project_categories where slug='tourism-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 18, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 19. Dr. Wafaa Mohsen
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('عيادة الدكتورة وفاء محسن','Dr. Wafaa Mohsen Medical Clinic','dr-wafaa-mohsen-clinic',
   $p$موقع إلكتروني تعريفي طبي يعرض نبذة عن الدكتورة وفاء محسن والخدمات والتخصصات والصور والشهادات وطرق التواصل.$p$,
   $p$A professional medical website presenting Dr. Wafaa Mohsen, her services, expertise, certificates, media gallery, and contact information.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لعيادة الدكتورة وفاء محسن. يعرض الموقع نبذة عن الطبيبة وخبراتها والخدمات والتخصصات الطبية التي تقدمها. تم إنشاء أقسام لعرض الخدمات والصور والفيديوهات والشهادات وآراء المراجعين. كما يتضمن الموقع معلومات التواصل وخريطة موقع العيادة وطرق الوصول إليها. تم بناء الموقع باستخدام WordPress مع تصميم طبي متجاوب ومناسب لجميع الأجهزة.$p$,
   $p$A professional medical website was developed for Dr. Wafaa Mohsen. The website introduces the doctor, her expertise, medical services, certificates, and professional experience. Dedicated sections showcase services, images, videos, certificates, and patient testimonials. The website also provides contact information, location details, and directions to the clinic. Built with WordPress using a responsive medical-focused interface.$p$,
   (select id from public.services where slug='doctor-clinic-website-development'),
   (select id from public.project_categories where slug='medical-clinic-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 19, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- 20. Sipora
insert into public.projects (title_ar, title_en, slug, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, service_id, category_id, status, technologies, status_field, sort, is_featured, published_at) values
  ('Sipora – استشارات وتطوير مشاريع المطاعم','Sipora – Restaurant Consulting & Development','sipora',
   $p$موقع إلكتروني تعريفي لشركة متخصصة في تأسيس وتطوير مشاريع المطاعم، من التخطيط ودراسات الجدوى إلى التصميم والتشغيل.$p$,
   $p$A professional corporate website for Sipora, specializing in restaurant consulting, planning, design, development, and operations.$p$,
   $p$تم تطوير موقع إلكتروني تعريفي احترافي لشركة Sipora المتخصصة في استشارات وتطوير مشاريع المطاعم. يعرض الموقع الخدمات التي تقدمها الشركة من دراسة المشروع والتخطيط وحتى التصميم والتجهيز والتشغيل. تم تنظيم الخدمات ضمن مراحل واضحة تساعد أصحاب المشاريع على فهم رحلة تطوير المطعم. كما يتضمن الموقع قسمًا للأسئلة الشائعة ونموذجًا لطلب الاستشارة ومعلومات التواصل. تم بناء الموقع باستخدام WordPress مع تصميم عصري متجاوب يعكس طبيعة قطاع المطاعم والاستشارات.$p$,
   $p$A professional corporate website was developed for Sipora, a restaurant consulting and development company. The website presents services covering feasibility studies, planning, design, fit-out, licensing, operations, and post-opening support. Services are organized into clear stages to help restaurant owners understand the development journey. The website also includes FAQs, consultation requests, company information, and contact details. Built with WordPress using a modern responsive design tailored to the restaurant consulting industry.$p$,
   (select id from public.services where slug='consulting-website-development'),
   (select id from public.project_categories where slug='consulting-websites'),
   'completed', array['WordPress','Elementor','PHP','MySQL','HTML5','CSS3','JavaScript','Responsive Design','SEO'], 'published', 20, true, now())
on conflict (slug) do update set
  title_ar = excluded.title_ar, title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar, short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar, full_desc_en = excluded.full_desc_en,
  service_id = excluded.service_id, category_id = excluded.category_id,
  status = excluded.status, technologies = excluded.technologies,
  status_field = excluded.status_field, sort = excluded.sort, is_featured = excluded.is_featured;

-- ============================================================================
-- SEO metadata (per locale). canonical_url/og_image are intentionally NOT
-- overwritten so any existing URL/OG image is preserved.
-- ============================================================================
create or replace function public.__seed_project_seo(slug text, loc text, seo_title text, meta_desc text, focus text, kws text[], og_title text, og_desc text) returns void language plpgsql as $$
begin
  insert into public.seo_metadata (entity_type, entity_id, locale, seo_title, meta_description, focus_keyword, keywords, og_title, og_description, robots, twitter_card)
  values ('project', (select id from public.projects where public.projects.slug = __seed_project_seo.slug), loc, seo_title, meta_desc, focus, kws, og_title, og_desc, 'index, follow', 'summary_large_image')
  on conflict (entity_type, entity_id, locale) do update set
    seo_title = excluded.seo_title, meta_description = excluded.meta_description,
    focus_keyword = excluded.focus_keyword, keywords = excluded.keywords,
    og_title = excluded.og_title, og_description = excluded.og_description,
    robots = excluded.robots, twitter_card = excluded.twitter_card;
end $$;

select public.__seed_project_seo('yassmin-abu-hadba-law','ar',
  'شركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية | الأردن',
  'موقع شركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية، للتعرف على الخدمات والتخصصات القانونية وفريق العمل وطرق التواصل.',
  'محامية واستشارات قانونية في الأردن',
  array['محاماة','استشارات قانونية','محامية في الأردن','خدمات قانونية','مكتب محاماة','استشارات قانونية الأردن'],
  'شركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية',
  'تعرف على خدمات شركة ياسمين أبو هدبة للمحاماة والاستشارات القانونية وخبراتها ومجالات اختصاصها.');
select public.__seed_project_seo('yassmin-abu-hadba-law','en',
  'Yassmin Abu Hadba Law & Legal Consultancy | Jordan',
  'Discover Yassmin Abu Hadba Law & Legal Consultancy, including legal services, areas of expertise, team information, and contact details.',
  'Lawyer and Legal Consultancy in Jordan',
  array['law firm','legal consultancy','lawyer in Jordan','legal services','Jordan law firm','legal consultation'],
  'Yassmin Abu Hadba Law & Legal Consultancy',
  'Explore the legal services, expertise, and areas of practice offered by Yassmin Abu Hadba Law & Legal Consultancy.');

select public.__seed_project_seo('al-sakha-academy','ar',
  'أكاديمية السخاء | دورات وتدريب طبي في الأردن',
  'أكاديمية السخاء للتدريب والتعليم الطبي، تعرف على الدورات والبرامج التدريبية والخدمات التعليمية المتخصصة.',
  'دورات طبية في الأردن',
  array['أكاديمية السخاء','دورات طبية','تدريب طبي','دورات تدريبية الأردن','تعليم طبي'],
  'أكاديمية السخاء للتدريب والتعليم الطبي',
  'تعرف على برامج ودورات أكاديمية السخاء وخدمات التدريب والتعليم الطبي.');
select public.__seed_project_seo('al-sakha-academy','en',
  'Al Sakha Academy | Medical Training Courses in Jordan',
  'Al Sakha Academy offers medical training and educational programs. Explore courses, training services, and academy information.',
  'Medical Training Courses in Jordan',
  array['Al Sakha Academy','medical courses','medical training','Jordan training courses','medical education'],
  'Al Sakha Academy – Medical Training & Education',
  'Discover Al Sakha Academy''s medical training programs, courses, and educational services.');

select public.__seed_project_seo('al-sakha-home-healthcare','ar',
  'السخاء للرعاية الصحية المنزلية | خدمات الرعاية المنزلية',
  'تعرف على خدمات السخاء للرعاية الصحية المنزلية والرعاية الطبية المقدمة للمرضى في المنزل.',
  'الرعاية الصحية المنزلية في الأردن',
  array['رعاية صحية منزلية','رعاية منزلية الأردن','خدمات طبية منزلية','تمريض منزلي','السخاء للرعاية'],
  'السخاء للرعاية الصحية المنزلية',
  'خدمات رعاية صحية وطبية منزلية متخصصة للمرضى والعائلات.');
select public.__seed_project_seo('al-sakha-home-healthcare','en',
  'Al Sakha Home Healthcare | Home Healthcare Services',
  'Explore Al Sakha Home Healthcare services and professional medical care solutions delivered to patients at home.',
  'Home Healthcare in Jordan',
  array['home healthcare Jordan','home nursing','home medical care','healthcare services Jordan'],
  'Al Sakha Home Healthcare',
  'Professional home healthcare and medical care services for patients and families.');

select public.__seed_project_seo('eftekhar-therapeutic-services','ar',
  'افتخار للخدمات العلاجية',
  'تعرف على افتخار للخدمات العلاجية والخدمات الطبية والتخصصات التي تقدمها المؤسسة.',
  'خدمات علاجية في الأردن',
  array['خدمات علاجية','مؤسسة طبية','رعاية صحية','علاج','افتخار'],
  'افتخار للخدمات العلاجية',
  'خدمات علاجية وطبية متخصصة تقدمها مؤسسة افتخار للخدمات العلاجية.');
select public.__seed_project_seo('eftekhar-therapeutic-services','en',
  'Eftekhar Therapeutic Services',
  'Discover Eftekhar Therapeutic Services and the medical and therapeutic care it provides.',
  'Therapeutic Services',
  array['therapeutic services','medical institution','healthcare','treatment','Eftekhar'],
  'Eftekhar Therapeutic Services',
  'Specialized therapeutic and medical services provided by Eftekhar Therapeutic Services.');

select public.__seed_project_seo('women-empowerment-support-association','ar',
  'جمعية دعم تمكين المرأة',
  'تعرف على جمعية دعم تمكين المرأة ومبادراتها وبرامجها ومشاريعها وأنشطتها المجتمعية.',
  'جمعية دعم تمكين المرأة',
  array['تمكين المرأة','جمعية','دعم المرأة','مبادرات','أنشطة مجتمعية'],
  'جمعية دعم تمكين المرأة',
  'مبادرات وبرامج ومشاريع لدعم وتمكين المرأة.');
select public.__seed_project_seo('women-empowerment-support-association','en',
  'Women Empowerment Support Association',
  'Learn about the Women Empowerment Support Association and its initiatives, programs, projects, and community activities.',
  'Women Empowerment Association',
  array['women empowerment','association','women support','initiatives','community activities'],
  'Women Empowerment Support Association',
  'Initiatives, programs, and projects supporting women empowerment.');

select public.__seed_project_seo('mass-aluminum-steel-systems','ar',
  'MASS | أنظمة الألمنيوم والحديد الحديثة',
  'تعرف على شركة MASS لأنظمة الألمنيوم والحديد الحديثة ومنتجاتها وخدماتها ومشاريعها.',
  'أنظمة الألمنيوم والحديد',
  array['أنظمة ألمنيوم','حديد','واجهات','شركة صناعية','MASS'],
  'MASS لأنظمة الألمنيوم والحديد الحديثة',
  'أنظمة ألمنيوم وحديد وواجهات حديثة من شركة MASS.');
select public.__seed_project_seo('mass-aluminum-steel-systems','en',
  'MASS | Modern Aluminum & Steel Systems',
  'Discover MASS – Modern Aluminum & Steel Systems and its products, services, and projects.',
  'Aluminum and Steel Systems',
  array['aluminum systems','steel','facades','industrial company','MASS'],
  'MASS – Modern Aluminum & Steel Systems',
  'Modern aluminum and steel systems from MASS.');

select public.__seed_project_seo('al-sakha-hospital','ar',
  'مستشفى السخاء | الرعاية الصحية المتكاملة',
  'تعرف على مستشفى السخاء وخدماته الطبية وأقسامه وأطبائه ومرافقه.',
  'مستشفى السخاء',
  array['مستشفى','رعاية صحية','خدمات طبية','أطباء','السخاء'],
  'مستشفى السخاء – الرعاية الصحية المتكاملة',
  'خدمات رعاية صحية متكاملة من مستشفى السخاء.');
select public.__seed_project_seo('al-sakha-hospital','en',
  'Al Sakha Hospital | Integrated Healthcare',
  'Discover Al Sakha Hospital and its medical services, departments, doctors, and facilities.',
  'Al Sakha Hospital',
  array['hospital','healthcare','medical services','doctors','Al Sakha'],
  'Al Sakha Hospital – Integrated Healthcare',
  'Integrated healthcare services from Al Sakha Hospital.');

select public.__seed_project_seo('pet-mall','ar',
  'Pet Mall | متجر مستلزمات الحيوانات الأليفة في الأردن',
  'تسوق مستلزمات الحيوانات الأليفة من Pet Mall، منتجات للقطط والكلاب والطيور وغيرها مع تجربة شراء إلكترونية سهلة.',
  'متجر مستلزمات الحيوانات الأليفة',
  array['متجر حيوانات','مستلزمات الحيوانات','طعام قطط','طعام كلاب','مستلزمات قطط','مستلزمات كلاب','متجر حيوانات الأردن'],
  'Pet Mall – متجر مستلزمات الحيوانات الأليفة',
  'متجر إلكتروني متكامل لمستلزمات ومنتجات الحيوانات الأليفة.');
select public.__seed_project_seo('pet-mall','en',
  'Pet Mall | Online Pet Supplies Store in Jordan',
  'Shop pet supplies online at Pet Mall, including products for cats, dogs, birds, and more with an easy online shopping experience.',
  'Pet Supplies Online Store',
  array['pet store Jordan','pet supplies','cat food','dog food','pet products','online pet shop Jordan'],
  'Pet Mall – Online Pet Supplies Store',
  'An online store for pet supplies, food, accessories, and products.');

select public.__seed_project_seo('dr-hamzah-bahaa-al-din-clinic','ar',
  'عيادة د. حمزة بهاء الدين',
  'تعرف على عيادة الدكتور حمزة بهاء الدين وخدماته الطبية وخبراته وطرق التواصل.',
  'عيادة د. حمزة بهاء الدين',
  array['عيادة','طبيب','خدمات طبية','د. حمزة بهاء الدين'],
  'عيادة د. حمزة بهاء الدين',
  'الخدمات الطبية وخبرات الدكتور حمزة بهاء الدين.');
select public.__seed_project_seo('dr-hamzah-bahaa-al-din-clinic','en',
  'Dr. Hamzah Bahaa Al-Din Clinic',
  'Discover Dr. Hamzah Bahaa Al-Din Clinic and its medical services, expertise, and contact information.',
  'Dr. Hamzah Bahaa Al-Din Clinic',
  array['clinic','doctor','medical services','Dr. Hamzah Bahaa Al-Din'],
  'Dr. Hamzah Bahaa Al-Din Clinic',
  'Medical services and expertise of Dr. Hamzah Bahaa Al-Din.');

select public.__seed_project_seo('mifm-islamic-financing-development','ar',
  'المؤسسة الإسلامية للتمويل والتنمية – MIFM',
  'تعرف على المؤسسة الإسلامية للتمويل والتنمية وبرامجها وخدماتها ومشاريعها.',
  'المؤسسة الإسلامية للتمويل والتنمية',
  array['تمويل','تنمية','مؤسسة إسلامية','MIFM','برامج تمويلية'],
  'المؤسسة الإسلامية للتمويل والتنمية – MIFM',
  'برامج وخدمات تمويل وتنمية من المؤسسة الإسلامية.');
select public.__seed_project_seo('mifm-islamic-financing-development','en',
  'MIFM – Islamic Financing & Development',
  'Discover MIFM – Islamic Financing & Development and its programs, services, and projects.',
  'Islamic Financing & Development',
  array['financing','development','Islamic institution','MIFM','financing programs'],
  'MIFM – Islamic Financing & Development',
  'Financing and development programs from the Islamic institution.');

select public.__seed_project_seo('zero-cosmetics','ar',
  'ZERO Cosmetics | متجر مستحضرات التجميل والعناية',
  'متجر ZERO Cosmetics لمستحضرات التجميل والعناية بالبشرة والشعر والمكياج، مع مجموعة متنوعة من المنتجات والعلامات التجارية.',
  'متجر مستحضرات التجميل',
  array['مستحضرات تجميل','متجر تجميل','عناية بالبشرة','عناية بالشعر','مكياج','منتجات تجميل الأردن'],
  'ZERO Cosmetics – متجر مستحضرات التجميل',
  'تسوق مستحضرات التجميل والعناية بالبشرة والشعر والمكياج من ZERO Cosmetics.');
select public.__seed_project_seo('zero-cosmetics','en',
  'ZERO Cosmetics | Beauty & Skincare Online Store',
  'Shop ZERO Cosmetics for beauty, skincare, haircare, and makeup products from a variety of trusted brands.',
  'Beauty and Skincare Online Store',
  array['beauty store','cosmetics online','skincare','haircare','makeup','cosmetics Jordan'],
  'ZERO Cosmetics – Beauty & Skincare Store',
  'Shop cosmetics, skincare, haircare, and beauty products at ZERO Cosmetics.');

select public.__seed_project_seo('sigma-detergents','ar',
  'سيجما للمنظفات – Sigma Detergents',
  'تعرف على شركة Sigma Detergents المتخصصة في منتجات التنظيف ومنتجاتها وأسواقها وخدماتها.',
  'سيجما للمنظفات',
  array['منظفات','منتجات تنظيف','شركة صناعية','Sigma Detergents'],
  'سيجما للمنظفات – Sigma Detergents',
  'منتجات تنظيف وحلول من شركة Sigma Detergents.');
select public.__seed_project_seo('sigma-detergents','en',
  'Sigma Detergents – Cleaning Products',
  'Discover Sigma Detergents and its cleaning products, markets, and services.',
  'Sigma Detergents',
  array['detergents','cleaning products','industrial company','Sigma Detergents'],
  'Sigma Detergents – Cleaning Products',
  'Cleaning products and solutions from Sigma Detergents.');

select public.__seed_project_seo('mentalyze-ai','ar',
  'Mentalyze AI | حلول الأعمال والذكاء الاصطناعي',
  'تعرف على Mentalyze AI وخدمات الاستشارات والتوظيف وتطوير البرمجيات وحلول الذكاء الاصطناعي.',
  'Mentalyze AI',
  array['ذكاء اصطناعي','استشارات','تطوير برمجيات','توظيف','Mentalyze AI'],
  'Mentalyze AI – حلول الأعمال والذكاء الاصطناعي',
  'حلول أعمال وتقنية وذكاء اصطناعي من Mentalyze AI.');
select public.__seed_project_seo('mentalyze-ai','en',
  'Mentalyze AI | Business & AI Solutions',
  'Discover Mentalyze AI and its consulting, recruitment, software development, and AI solutions.',
  'Mentalyze AI',
  array['AI','consulting','software development','recruitment','Mentalyze AI'],
  'Mentalyze AI – Business & AI Solutions',
  'Business, technology, and AI solutions from Mentalyze AI.');

select public.__seed_project_seo('code-strength','ar',
  'Code Strength | الأمن السيبراني والحلول التقنية',
  'تعرف على Code Strength وحلول الأمن السيبراني والبنية التحتية وإدارة المخاطر والامتثال.',
  'الأمن السيبراني',
  array['أمن سيبراني','بنية تحتية','إدارة مخاطر','امتثال','Code Strength'],
  'Code Strength – الأمن السيبراني والحلول التقنية',
  'حلول أمن سيبراني وتقنية من Code Strength.');
select public.__seed_project_seo('code-strength','en',
  'Code Strength | Cybersecurity & IT Solutions',
  'Discover Code Strength and its cybersecurity, infrastructure, risk management, and compliance solutions.',
  'Cybersecurity',
  array['cybersecurity','infrastructure','risk management','compliance','Code Strength'],
  'Code Strength – Cybersecurity & IT Solutions',
  'Cybersecurity and IT solutions from Code Strength.');

select public.__seed_project_seo('al-zawraa-engineering-industries','ar',
  'شركة الزوراء للصناعات الهندسية',
  'تعرف على شركة الزوراء للصناعات الهندسية ومنتجاتها وخدماتها ومشاريعها الهندسية.',
  'شركة الزوراء للصناعات الهندسية',
  array['صناعات هندسية','شركة صناعية','معدات','الزوراء'],
  'شركة الزوراء للصناعات الهندسية',
  'منتجات وخدمات هندسية من شركة الزوراء.');
select public.__seed_project_seo('al-zawraa-engineering-industries','en',
  'Al Zawraa Engineering Industries',
  'Discover Al Zawraa Engineering Industries and its products, services, and engineering projects.',
  'Al Zawraa Engineering Industries',
  array['engineering industries','industrial company','equipment','Al Zawraa'],
  'Al Zawraa Engineering Industries',
  'Engineering products and services from Al Zawraa.');

select public.__seed_project_seo('benz-perfume','ar',
  'BENZ Perfume | متجر عطور أونلاين',
  'تسوق العطور من BENZ Perfume، مجموعة من العطور الرجالية والنسائية مع تصنيفات وعروض ومنتجات متنوعة.',
  'متجر عطور أونلاين',
  array['عطور','متجر عطور','عطور رجالية','عطور نسائية','عطور أونلاين','شراء عطور'],
  'BENZ Perfume – متجر العطور',
  'متجر إلكتروني متخصص في العطور الرجالية والنسائية والعروض المميزة.');
select public.__seed_project_seo('benz-perfume','en',
  'BENZ Perfume | Online Fragrance Store',
  'Shop BENZ Perfume online for men''s and women''s fragrances, special offers, best sellers, and a variety of scents.',
  'Online Perfume Store',
  array['perfume store','online perfume','men''s perfume','women''s perfume','fragrances online'],
  'BENZ Perfume – Online Fragrance Store',
  'An online fragrance store featuring men''s and women''s perfumes, offers, and best sellers.');

select public.__seed_project_seo('ksa-meds','ar',
  'KSA Meds | الصيدلة والأدوية المتخصصة',
  'تعرف على KSA Meds وخدمات الصيدلة والأدوية والمستحضرات الطبية ومزاياها.',
  'KSA Meds',
  array['صيدلة','أدوية','مستحضرات طبية','KSA Meds'],
  'KSA Meds – الصيدلة والأدوية المتخصصة',
  'خدمات صيدلة وأدوية متخصصة من KSA Meds.');
select public.__seed_project_seo('ksa-meds','en',
  'KSA Meds | Specialty Pharmacy Services',
  'Discover KSA Meds and its specialty pharmacy and medication services.',
  'KSA Meds',
  array['pharmacy','medication','pharmaceutical','KSA Meds'],
  'KSA Meds – Specialty Pharmacy Services',
  'Specialty pharmacy and medication services from KSA Meds.');

select public.__seed_project_seo('sabarini-travel','ar',
  'Sabarini Travel | رحلات وسياحة في الأردن',
  'اكتشف الأردن مع Sabarini Travel من خلال الرحلات والباقات السياحية والوجهات المميزة وتجارب السفر المصممة للزوار.',
  'رحلات سياحية في الأردن',
  array['سياحة الأردن','رحلات الأردن','جولات الأردن','البتراء','وادي رم','سياحة في الأردن','برامج سياحية'],
  'Sabarini Travel – السياحة والرحلات في الأردن',
  'اكتشف أجمل الوجهات والرحلات والباقات السياحية في الأردن مع Sabarini Travel.');
select public.__seed_project_seo('sabarini-travel','en',
  'Sabarini Travel | Jordan Tours & Travel',
  'Explore Jordan with Sabarini Travel through curated tours, travel packages, destinations, and authentic Jordanian experiences.',
  'Jordan Tours',
  array['Jordan tours','Jordan travel','Petra tours','Wadi Rum tours','Jordan tourism','travel packages Jordan'],
  'Sabarini Travel – Jordan Tours & Travel',
  'Discover Jordan''s destinations, tours, travel packages, and authentic experiences with Sabarini Travel.');

select public.__seed_project_seo('dr-wafaa-mohsen-clinic','ar',
  'عيادة الدكتورة وفاء محسن',
  'تعرف على عيادة الدكتورة وفاء محسن وخدماتها الطبية وتخصصاتها وشهاداتها وطرق التواصل.',
  'عيادة الدكتورة وفاء محسن',
  array['عيادة','طبيبة','خدمات طبية','د. وفاء محسن'],
  'عيادة الدكتورة وفاء محسن',
  'الخدمات الطبية وخبرات الدكتورة وفاء محسن.');
select public.__seed_project_seo('dr-wafaa-mohsen-clinic','en',
  'Dr. Wafaa Mohsen Medical Clinic',
  'Discover Dr. Wafaa Mohsen Medical Clinic and its medical services, expertise, certificates, and contact information.',
  'Dr. Wafaa Mohsen Clinic',
  array['clinic','doctor','medical services','Dr. Wafaa Mohsen'],
  'Dr. Wafaa Mohsen Medical Clinic',
  'Medical services and expertise of Dr. Wafaa Mohsen.');

select public.__seed_project_seo('sipora','ar',
  'Sipora | استشارات وتطوير مشاريع المطاعم',
  'Sipora تقدم استشارات وتطوير مشاريع المطاعم من دراسة الجدوى والتخطيط إلى التصميم والتجهيز والتشغيل.',
  'استشارات مشاريع المطاعم',
  array['استشارات مطاعم','تأسيس مطعم','تطوير المطاعم','دراسة جدوى مطعم','تصميم مطاعم','تشغيل مطاعم'],
  'Sipora – استشارات وتطوير مشاريع المطاعم',
  'حلول واستشارات متكاملة لتأسيس وتطوير وتشغيل مشاريع المطاعم.');
select public.__seed_project_seo('sipora','en',
  'Sipora | Restaurant Consulting & Development',
  'Sipora provides restaurant consulting and development services from feasibility studies and planning to design, fit-out, and operations.',
  'Restaurant Consulting',
  array['restaurant consulting','restaurant development','restaurant setup','restaurant feasibility study','restaurant design','restaurant operations'],
  'Sipora – Restaurant Consulting & Development',
  'End-to-end consulting and development solutions for restaurant projects.');

drop function if exists public.__seed_project_seo(text, text, text, text, text, text[], text, text);

-- ============================================================================
-- Project features (replace per-project so ordering is exact & idempotent)
-- ============================================================================
create or replace function public.__seed_project_features(slug text, features text[][]) returns void language plpgsql as $$
declare
  pid uuid;
  f text[];
  i int;
begin
  select id into pid from public.projects where public.projects.slug = __seed_project_features.slug;
  if pid is null then return; end if;
  delete from public.project_features where project_id = pid;
  i := 1;
  foreach f slice 1 in array features loop
    insert into public.project_features (project_id, title_ar, title_en, sort) values (pid, f[1], f[2], i);
    i := i + 1;
  end loop;
end $$;

select public.__seed_project_features('yassmin-abu-hadba-law', array[
  array['تصميم احترافي للهوية القانونية','Professional legal identity design'],
  array['عرض الخدمات والتخصصات القانونية','Legal services & practice areas'],
  array['قسم فريق العمل','Team section'],
  array['آراء العملاء','Client testimonials'],
  array['معلومات التواصل والموقع','Contact & location info'],
  array['تصميم متجاوب','Responsive design'],
  array['تحسين محركات البحث','SEO optimization']
]);

select public.__seed_project_features('al-sakha-academy', array[
  array['عرض الدورات والبرامج','Courses & programs'],
  array['أقسام تعليمية','Educational sections'],
  array['أخبار ومحتوى','News & content'],
  array['معلومات الأكاديمية','Academy information'],
  array['نماذج التواصل','Contact forms'],
  array['تصميم متجاوب','Responsive design'],
  array['SEO','SEO']
]);

select public.__seed_project_features('al-sakha-home-healthcare', array[
  array['عرض الخدمات الطبية','Medical services'],
  array['عرض الفريق الطبي','Medical team'],
  array['طلب الخدمة','Service request'],
  array['آراء العملاء','Testimonials'],
  array['معلومات التواصل','Contact info'],
  array['تصميم متجاوب','Responsive design'],
  array['تحسين SEO','SEO optimization']
]);

select public.__seed_project_features('eftekhar-therapeutic-services', array[
  array['عرض الخدمات العلاجية','Therapeutic services'],
  array['أقسام تعريفية','About sections'],
  array['معرض صور','Image gallery'],
  array['معلومات التواصل','Contact info'],
  array['نماذج الاستفسار','Inquiry forms'],
  array['تصميم متجاوب','Responsive design'],
  array['SEO','SEO']
]);

select public.__seed_project_features('women-empowerment-support-association', array[
  array['عرض المبادرات والمشاريع','Initiatives & projects'],
  array['الأخبار والدراسات','News & studies'],
  array['فريق العمل','Team'],
  array['معرض الصور والفيديو','Photo & video gallery'],
  array['معلومات الجمعية','Association info'],
  array['التواصل','Contact'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('mass-aluminum-steel-systems', array[
  array['عرض المنتجات','Products'],
  array['معرض المشاريع','Project portfolio'],
  array['الخدمات','Services'],
  array['طلب عرض سعر','Quote request'],
  array['الأسئلة الشائعة','FAQ'],
  array['آراء العملاء','Testimonials'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('al-sakha-hospital', array[
  array['الخدمات الطبية','Medical services'],
  array['الأقسام الطبية','Medical departments'],
  array['الأطباء','Doctors'],
  array['معرض الصور','Image gallery'],
  array['الأخبار','News'],
  array['الأسئلة الشائعة','FAQ'],
  array['آراء المرضى','Patient testimonials'],
  array['معلومات التواصل','Contact info']
]);

select public.__seed_project_features('pet-mall', array[
  array['متجر إلكتروني','Online store'],
  array['تصنيفات المنتجات','Product categories'],
  array['سلة المشتريات','Shopping cart'],
  array['إدارة الطلبات','Order management'],
  array['المنتجات الجديدة','New arrivals'],
  array['الأكثر مبيعًا','Best sellers'],
  array['العروض','Offers'],
  array['آراء العملاء','Customer reviews'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('dr-hamzah-bahaa-al-din-clinic', array[
  array['التعريف بالطبيب','Doctor introduction'],
  array['الخدمات الطبية','Medical services'],
  array['معرض الصور','Image gallery'],
  array['الفيديو','Video'],
  array['الشهادات','Certificates'],
  array['آراء المرضى','Patient testimonials'],
  array['معلومات العيادة','Clinic info'],
  array['خريطة الموقع','Location map']
]);

select public.__seed_project_features('mifm-islamic-financing-development', array[
  array['البرامج التمويلية','Financing programs'],
  array['الخدمات','Services'],
  array['المشاريع','Projects'],
  array['الشركاء','Partners'],
  array['الأخبار','News'],
  array['نماذج التواصل','Contact forms'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('zero-cosmetics', array[
  array['متجر إلكتروني','Online store'],
  array['تصنيفات المنتجات','Product categories'],
  array['العلامات التجارية','Brands'],
  array['العروض','Offers'],
  array['المنتجات الجديدة','New arrivals'],
  array['الأكثر مبيعًا','Best sellers'],
  array['سلة وطلبات','Cart & orders'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('sigma-detergents', array[
  array['عرض المنتجات','Products'],
  array['التصنيفات','Categories'],
  array['الأسواق','Markets'],
  array['الشركاء','Partners'],
  array['معلومات الشركة','Company info'],
  array['معرض الصور','Image gallery'],
  array['التواصل','Contact']
]);

select public.__seed_project_features('mentalyze-ai', array[
  array['عرض الخدمات','Services'],
  array['حلول AI','AI solutions'],
  array['القطاعات','Industries'],
  array['الخبرات','Expertise'],
  array['مراحل العمل','Work process'],
  array['نموذج التواصل','Contact form'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('code-strength', array[
  array['خدمات الأمن السيبراني','Cybersecurity services'],
  array['إدارة المخاطر','Risk management'],
  array['الامتثال','Compliance'],
  array['البنية التحتية','Infrastructure'],
  array['دراسات الحالات','Case studies'],
  array['طلب استشارة','Consultation request'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('al-zawraa-engineering-industries', array[
  array['المنتجات','Products'],
  array['الخدمات','Services'],
  array['المشاريع','Projects'],
  array['معرض الصور','Image gallery'],
  array['الأسواق','Markets'],
  array['معلومات الشركة','Company info'],
  array['التواصل','Contact']
]);

select public.__seed_project_features('benz-perfume', array[
  array['متجر عطور','Perfume store'],
  array['تصنيفات المنتجات','Product categories'],
  array['عروض','Offers'],
  array['الأكثر طلبًا','Best sellers'],
  array['عطور رجالية','Men''s fragrances'],
  array['عطور نسائية','Women''s fragrances'],
  array['سلة وطلبات','Cart & orders'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('ksa-meds', array[
  array['الخدمات الدوائية','Pharmacy services'],
  array['معلومات الشركة','Company info'],
  array['الخدمات الطبية','Medical services'],
  array['المزايا','Advantages'],
  array['القطاعات المستهدفة','Target sectors'],
  array['معلومات التواصل','Contact info']
]);

select public.__seed_project_features('sabarini-travel', array[
  array['الوجهات السياحية','Destinations'],
  array['الرحلات','Tours'],
  array['الباقات','Packages'],
  array['الخدمات السياحية','Travel services'],
  array['الاستفسار عن الرحلات','Trip inquiries'],
  array['التخطيط للرحلات','Trip planning'],
  array['معلومات السفر','Travel info'],
  array['تصميم متجاوب','Responsive design']
]);

select public.__seed_project_features('dr-wafaa-mohsen-clinic', array[
  array['التعريف بالطبيبة','Doctor introduction'],
  array['الخدمات الطبية','Medical services'],
  array['الشهادات','Certificates'],
  array['معرض الصور','Image gallery'],
  array['الفيديو','Video'],
  array['آراء المراجعين','Patient testimonials'],
  array['خريطة الموقع','Location map'],
  array['التواصل','Contact']
]);

select public.__seed_project_features('sipora', array[
  array['عرض الخدمات','Services'],
  array['مراحل تأسيس المطاعم','Restaurant setup stages'],
  array['الاستشارات','Consulting'],
  array['دراسات الجدوى','Feasibility studies'],
  array['الأسئلة الشائعة','FAQ'],
  array['طلب استشارة','Consultation request'],
  array['معلومات التواصل','Contact info'],
  array['تصميم متجاوب','Responsive design']
]);

drop function if exists public.__seed_project_features(text, text[][]);
