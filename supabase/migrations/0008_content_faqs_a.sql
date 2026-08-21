-- ============================================================================
-- Sitekoom — Content population (Service FAQs 1-4)
-- ============================================================================

delete from public.service_faqs
where service_id in (select id from public.services where slug in ('web-development','ecommerce','custom-software','mobile-apps'));

insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort)
select s.id, v.q_ar, v.q_en, v.a_ar, v.a_en, v.sort
from public.services s
join (values

  -- ===== Web Development =====
  ('web-development',$c$كم يستغرق بناء الموقع؟$c$,$c$How long does it take to build a website?$c$,
   $c$تختلف مدة التنفيذ حسب حجم المشروع وعدد الصفحات والخصائص المطلوبة، لكن بعد اعتماد المتطلبات يتم تحديد جدول زمني واضح للمشروع.$c$,
   $c$The timeline depends on the project scope, number of pages and required functionality. A clear timeline is established after reviewing the requirements.$c$,1),
  ('web-development',$c$هل الموقع يعمل على الهاتف؟$c$,$c$Will the website work on mobile devices?$c$,
   $c$نعم، جميع المواقع يتم تصميمها لتعمل على الهواتف والأجهزة اللوحية وأجهزة الكمبيوتر.$c$,
   $c$Yes. Our websites are designed to provide an optimized experience across smartphones, tablets and desktop devices.$c$,2),
  ('web-development',$c$هل أستطيع تعديل محتوى الموقع؟$c$,$c$Can I manage the website myself?$c$,
   $c$نعم، يمكن توفير لوحة تحكم تمكنك من إدارة الصفحات والمحتوى والصور والأخبار وغيرها.$c$,
   $c$Yes. We can provide an easy-to-use CMS that allows you to manage content, images, pages, articles and other website elements.$c$,3),
  ('web-development',$c$هل تقدمون خدمات SEO؟$c$,$c$Do you provide SEO services?$c$,
   $c$نقوم ببناء الموقع بطريقة مهيأة لمحركات البحث مع إمكانية تنفيذ خدمات SEO متقدمة حسب احتياجات المشروع.$c$,
   $c$We build websites with SEO best practices in mind and can also provide advanced SEO services based on your goals.$c$,4),
  ('web-development',$c$هل يمكن ربط الموقع بأنظمة أخرى؟$c$,$c$Can you integrate external systems?$c$,
   $c$نعم، يمكن ربط الموقع بأنظمة وخدمات خارجية من خلال APIs والتكاملات المناسبة.$c$,
   $c$Yes. We can connect websites with third-party services and systems through APIs and custom integrations.$c$,5),
  ('web-development',$c$هل تقدمون الدعم بعد إطلاق الموقع؟$c$,$c$Do you provide support after launch?$c$,
   $c$نعم، نوفر الدعم والصيانة والتطوير المستمر حسب الاتفاق.$c$,
   $c$Yes. We provide ongoing maintenance, support and development according to the selected service plan.$c$,6),

  -- ===== E-Commerce =====
  ('ecommerce',$c$هل يمكن ربط بوابة دفع؟$c$,$c$Can you integrate payment gateways?$c$,
   $c$نعم، يمكن ربط بوابات الدفع المناسبة للسوق المستهدف.$c$,
   $c$Yes. We can integrate suitable payment providers based on your target market and requirements.$c$,1),
  ('ecommerce',$c$هل يمكن ربط شركات الشحن؟$c$,$c$Can you integrate shipping services?$c$,
   $c$نعم، يمكن إضافة طرق شحن مختلفة وربط خدمات الشحن حسب المتطلبات.$c$,
   $c$Yes. Shipping methods and third-party shipping services can be integrated when required.$c$,2),
  ('ecommerce',$c$هل يمكن إضافة عدد كبير من المنتجات؟$c$,$c$Can the store handle many products?$c$,
   $c$نعم، يتم بناء المتجر بطريقة تسمح بالتوسع وإدارة كميات كبيرة من المنتجات.$c$,
   $c$Yes. We build scalable architectures suitable for growing product catalogs.$c$,3),
  ('ecommerce',$c$هل يمكن ربط المتجر بالمخزون؟$c$,$c$Can the store connect to inventory or ERP systems?$c$,
   $c$نعم، يمكن ربطه بأنظمة المخزون أو ERP أو أنظمة خارجية.$c$,
   $c$Yes. We can integrate your store with inventory, ERP and external business systems.$c$,4),
  ('ecommerce',$c$هل يمكن إدارة المتجر من الهاتف؟$c$,$c$Can I manage the store from mobile?$c$,
   $c$نعم، يمكن توفير لوحة تحكم متجاوبة تعمل على الهاتف والأجهزة اللوحية.$c$,
   $c$Yes. We can provide a responsive admin panel that works on mobile and tablet devices.$c$,5),
  ('ecommerce',$c$هل تهتمون بتحسين تجربة الشراء؟$c$,$c$Do you optimize the shopping experience?$c$,
   $c$نعم، نركز على سرعة التصفح وسهولة التنقل ووضوح خطوات الشراء لتحسين التحويل.$c$,
   $c$Yes. We focus on fast browsing, clear navigation and a smooth checkout to improve conversion.$c$,6),

  -- ===== Custom Software =====
  ('custom-software',$c$هل يمكن بناء نظام من الصفر؟$c$,$c$Can you build a system from scratch?$c$,
   $c$نعم، يمكن تصميم وتطوير النظام بناءً على متطلبات العمل.$c$,
   $c$Yes. We design and develop custom systems based on your business requirements.$c$,1),
  ('custom-software',$c$هل يمكن ربط النظام بأنظمة أخرى؟$c$,$c$Can the system integrate with other platforms?$c$,
   $c$نعم، يمكن تطوير APIs والتكامل مع الأنظمة والخدمات الخارجية.$c$,
   $c$Yes. We can build APIs and integrate the system with external platforms and services.$c$,2),
  ('custom-software',$c$هل يمكن تطوير النظام مستقبلًا؟$c$,$c$Can the system be expanded later?$c$,
   $c$نعم، يتم تصميم الأنظمة بطريقة Modular تسمح بإضافة وظائف مستقبلية.$c$,
   $c$Yes. Our systems are designed with scalability and future development in mind.$c$,3),
  ('custom-software',$c$كم يستغرق تطوير نظام مخصص؟$c$,$c$How long does custom software take?$c$,
   $c$تعتمد المدة على حجم المشروع وتعقيد المتطلبات، ويتم تحديد جدول زمني واضح بعد دراسة المتطلبات.$c$,
   $c$The timeline depends on project scope and complexity. A clear schedule is defined after the requirements are reviewed.$c$,4),
  ('custom-software',$c$هل تقدمون الدعم بعد التسليم؟$c$,$c$Do you provide support after delivery?$c$,
   $c$نعم، نوفر الدعم الفني والصيانة والتطوير المستمر حسب الاتفاق.$c$,
   $c$Yes. We provide technical support, maintenance and ongoing development according to the agreement.$c$,5),
  ('custom-software',$c$هل يمكن ترحيل البيانات من أنظمة قديمة؟$c$,$c$Can you migrate data from legacy systems?$c$,
   $c$نعم، يمكن دراسة البيانات الحالية وترحيلها إلى النظام الجديد بشكل آمن.$c$,
   $c$Yes. We can analyze your existing data and migrate it to the new system securely.$c$,6),

  -- ===== Mobile Apps =====
  ('mobile-apps',$c$هل يمكن تطوير التطبيق لأندرويد وiOS؟$c$,$c$Can you build apps for both Android and iOS?$c$,
   $c$نعم، يمكن تطوير التطبيق للمنصتين حسب طبيعة المشروع.$c$,
   $c$Yes. We can develop for both platforms based on your project requirements.$c$,1),
  ('mobile-apps',$c$هل يمكن ربط التطبيق بموقع أو نظام؟$c$,$c$Can the app connect to an existing website or system?$c$,
   $c$نعم، يمكن ربط التطبيقات بالـAPIs والأنظمة الحالية.$c$,
   $c$Yes. Mobile applications can connect to existing systems through APIs.$c$,2),
  ('mobile-apps',$c$هل تساعدون في نشر التطبيق؟$c$,$c$Can you help publish the app?$c$,
   $c$نعم، يمكن المساعدة في تجهيز ونشر التطبيق على المتاجر حسب نطاق المشروع.$c$,
   $c$Yes. We can assist with preparing and publishing applications according to the project scope.$c$,3),
  ('mobile-apps',$c$كم يستغرق تطوير التطبيق؟$c$,$c$How long does app development take?$c$,
   $c$تعتمد المدة على خصائص التطبيق وتعقيده، ويتم تحديد جدول زمني واضح بعد دراسة المتطلبات.$c$,
   $c$The timeline depends on the features and complexity of the app. A clear schedule is set after reviewing requirements.$c$,4),
  ('mobile-apps',$c$هل تقدمون الصيانة والتحديثات؟$c$,$c$Do you provide maintenance and updates?$c$,
   $c$نعم، نوفر الصيانة والتحديثات والتطوير المستمر للتطبيق.$c$,
   $c$Yes. We provide ongoing maintenance, updates and continuous development for your application.$c$,5)

) as v(slug, q_ar, q_en, a_ar, a_en, sort) on s.slug = v.slug;
