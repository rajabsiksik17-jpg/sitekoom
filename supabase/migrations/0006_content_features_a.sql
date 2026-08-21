-- ============================================================================
-- Sitekoom — Content population (Service Features 1-4)
-- Replaces existing features for these services, then inserts full content.
-- ============================================================================

delete from public.service_features
where service_id in (select id from public.services where slug in ('web-development','ecommerce','custom-software','mobile-apps'));

insert into public.service_features (service_id, kind, title_ar, title_en, sort)
select s.id, v.kind, v.ar, v.en, v.sort
from public.services s
join (values

  -- ===== Web Development =====
  ('web-development','feature',$c$تصميم عصري ومتوافق مع الهوية البصرية$c$,$c$Modern brand-focused design$c$,1),
  ('web-development','feature',$c$Responsive Design لجميع الأجهزة$c$,$c$Fully responsive experience$c$,2),
  ('web-development','feature',$c$لوحة تحكم سهلة لإدارة المحتوى$c$,$c$Easy-to-manage CMS$c$,3),
  ('web-development','feature',$c$تحسين سرعة وأداء الموقع$c$,$c$Performance optimization$c$,4),
  ('web-development','feature',$c$تهيئة الموقع لمحركات البحث SEO$c$,$c$SEO-ready architecture$c$,5),
  ('web-development','feature',$c$حماية وأمان متقدم$c$,$c$Security best practices$c$,6),
  ('web-development','feature',$c$ربط Google Analytics وSearch Console$c$,$c$Google Analytics and Search Console integration$c$,7),
  ('web-development','feature',$c$دمج وسائل التواصل الاجتماعي$c$,$c$Social media integration$c$,8),
  ('web-development','feature',$c$إمكانية ربط APIs وخدمات خارجية$c$,$c$API integrations$c$,9),
  ('web-development','feature',$c$قابلية التوسع مستقبلًا$c$,$c$Scalable architecture$c$,10),

  ('web-development','benefit',$c$بناء حضور رقمي احترافي$c$,$c$Build a professional digital presence$c$,1),
  ('web-development','benefit',$c$زيادة ثقة العملاء بالشركة$c$,$c$Increase customer trust$c$,2),
  ('web-development','benefit',$c$تحسين تجربة المستخدم$c$,$c$Improve user experience$c$,3),
  ('web-development','benefit',$c$الوصول إلى عملاء جدد من محركات البحث$c$,$c$Reach more potential customers$c$,4),
  ('web-development','benefit',$c$عرض الخدمات والأعمال بطريقة احترافية$c$,$c$Present services professionally$c$,5),
  ('web-development','benefit',$c$تسهيل التواصل مع العملاء$c$,$c$Make customer communication easier$c$,6),
  ('web-development','benefit',$c$توفير منصة قابلة للتطوير مستقبلًا$c$,$c$Create a scalable digital foundation$c$,7),

  ('web-development','process',$c$1. دراسة المتطلبات$c$,$c$1. Discovery$c$,1),
  ('web-development','process',$c$2. التخطيط وبناء الهيكل$c$,$c$2. Planning$c$,2),
  ('web-development','process',$c$3. تصميم تجربة المستخدم والواجهات$c$,$c$3. UX/UI Design$c$,3),
  ('web-development','process',$c$4. تطوير الموقع$c$,$c$4. Development$c$,4),
  ('web-development','process',$c$5. ربط الأنظمة والخدمات المطلوبة$c$,$c$5. Integrations$c$,5),
  ('web-development','process',$c$6. اختبار الموقع$c$,$c$6. Testing$c$,6),
  ('web-development','process',$c$7. تحسين الأداء وSEO$c$,$c$7. SEO & Performance Optimization$c$,7),
  ('web-development','process',$c$8. الإطلاق$c$,$c$8. Launch$c$,8),
  ('web-development','process',$c$9. الدعم والتطوير المستمر$c$,$c$9. Ongoing Support$c$,9),

  ('web-development','technology',$c$WordPress$c$,$c$WordPress$c$,1),
  ('web-development','technology',$c$WooCommerce$c$,$c$WooCommerce$c$,2),
  ('web-development','technology',$c$Laravel$c$,$c$Laravel$c$,3),
  ('web-development','technology',$c$PHP$c$,$c$PHP$c$,4),
  ('web-development','technology',$c$React$c$,$c$React$c$,5),
  ('web-development','technology',$c$Vue.js$c$,$c$Vue.js$c$,6),
  ('web-development','technology',$c$Next.js$c$,$c$Next.js$c$,7),
  ('web-development','technology',$c$MySQL$c$,$c$MySQL$c$,8),
  ('web-development','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,9),
  ('web-development','technology',$c$REST APIs$c$,$c$REST APIs$c$,10),

  -- ===== E-Commerce =====
  ('ecommerce','feature',$c$تصميم احترافي للمتجر$c$,$c$Professional storefront design$c$,1),
  ('ecommerce','feature',$c$إدارة المنتجات والتصنيفات$c$,$c$Product management$c$,2),
  ('ecommerce','feature',$c$إدارة المخزون$c$,$c$Inventory management$c$,3),
  ('ecommerce','feature',$c$إدارة الطلبات$c$,$c$Order management$c$,4),
  ('ecommerce','feature',$c$كوبونات وخصومات$c$,$c$Discounts and coupons$c$,5),
  ('ecommerce','feature',$c$بوابات دفع$c$,$c$Payment gateways$c$,6),
  ('ecommerce','feature',$c$خيارات شحن متعددة$c$,$c$Shipping options$c$,7),
  ('ecommerce','feature',$c$حسابات العملاء$c$,$c$Customer accounts$c$,8),
  ('ecommerce','feature',$c$Wishlist$c$,$c$Wishlist$c$,9),
  ('ecommerce','feature',$c$تقييمات المنتجات$c$,$c$Product reviews$c$,10),
  ('ecommerce','feature',$c$تقارير المبيعات$c$,$c$Sales reporting$c$,11),
  ('ecommerce','feature',$c$SEO للمنتجات$c$,$c$Product SEO$c$,12),
  ('ecommerce','feature',$c$تكاملات خارجية$c$,$c$Third-party integrations$c$,13),

  ('ecommerce','benefit',$c$بيع المنتجات على مدار الساعة$c$,$c$Sell 24/7$c$,1),
  ('ecommerce','benefit',$c$الوصول إلى أسواق جديدة$c$,$c$Reach new markets$c$,2),
  ('ecommerce','benefit',$c$تقليل الاعتماد على المبيعات التقليدية$c$,$c$Reduce reliance on traditional sales$c$,3),
  ('ecommerce','benefit',$c$إدارة المنتجات والطلبات من مكان واحد$c$,$c$Centralize order management$c$,4),
  ('ecommerce','benefit',$c$تحسين تجربة الشراء$c$,$c$Improve shopping experience$c$,5),
  ('ecommerce','benefit',$c$متابعة أداء المبيعات$c$,$c$Track sales performance$c$,6),

  ('ecommerce','process',$c$1. دراسة المتطلبات$c$,$c$1. Discovery$c$,1),
  ('ecommerce','process',$c$2. تخطيط المتجر$c$,$c$2. Planning$c$,2),
  ('ecommerce','process',$c$3. تصميم تجربة الشراء$c$,$c$3. UX/UI Design$c$,3),
  ('ecommerce','process',$c$4. التطوير$c$,$c$4. Development$c$,4),
  ('ecommerce','process',$c$5. الربط بالدفع والشحن$c$,$c$5. Payments & Shipping Integration$c$,5),
  ('ecommerce','process',$c$6. الاختبار$c$,$c$6. Testing$c$,6),
  ('ecommerce','process',$c$7. الإطلاق$c$,$c$7. Launch$c$,7),
  ('ecommerce','process',$c$8. الدعم والتطوير المستمر$c$,$c$8. Ongoing Support$c$,8),

  ('ecommerce','technology',$c$WooCommerce$c$,$c$WooCommerce$c$,1),
  ('ecommerce','technology',$c$Laravel$c$,$c$Laravel$c$,2),
  ('ecommerce','technology',$c$React$c$,$c$React$c$,3),
  ('ecommerce','technology',$c$Next.js$c$,$c$Next.js$c$,4),
  ('ecommerce','technology',$c$PHP$c$,$c$PHP$c$,5),
  ('ecommerce','technology',$c$MySQL$c$,$c$MySQL$c$,6),
  ('ecommerce','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,7),
  ('ecommerce','technology',$c$Payment APIs$c$,$c$Payment APIs$c$,8),
  ('ecommerce','technology',$c$Shipping APIs$c$,$c$Shipping APIs$c$,9),

  -- ===== Custom Software =====
  ('custom-software','feature',$c$تحليل المتطلبات$c$,$c$Requirements analysis$c$,1),
  ('custom-software','feature',$c$Architecture مخصصة$c$,$c$Custom architecture$c$,2),
  ('custom-software','feature',$c$لوحات تحكم$c$,$c$Admin dashboards$c$,3),
  ('custom-software','feature',$c$APIs$c$,$c$APIs$c$,4),
  ('custom-software','feature',$c$أنظمة متعددة المستخدمين$c$,$c$Multi-user systems$c$,5),
  ('custom-software','feature',$c$صلاحيات وأدوار$c$,$c$Roles and permissions$c$,6),
  ('custom-software','feature',$c$Integrations$c$,$c$Integrations$c$,7),
  ('custom-software','feature',$c$تقارير$c$,$c$Reporting$c$,8),
  ('custom-software','feature',$c$Notifications$c$,$c$Notifications$c$,9),
  ('custom-software','feature',$c$قابلية التوسع$c$,$c$Scalable architecture$c$,10),

  ('custom-software','benefit',$c$نظام يناسب طريقة عملك$c$,$c$Software built around your workflow$c$,1),
  ('custom-software','benefit',$c$تقليل العمل اليدوي$c$,$c$Reduced manual work$c$,2),
  ('custom-software','benefit',$c$أتمتة العمليات$c$,$c$Process automation$c$,3),
  ('custom-software','benefit',$c$تقليل الأخطاء$c$,$c$Fewer operational errors$c$,4),
  ('custom-software','benefit',$c$تحسين الإنتاجية$c$,$c$Improved productivity$c$,5),
  ('custom-software','benefit',$c$التحكم بالبيانات$c$,$c$Better data control$c$,6),

  ('custom-software','process',$c$1. دراسة المتطلبات$c$,$c$1. Discovery$c$,1),
  ('custom-software','process',$c$2. التحليل$c$,$c$2. Analysis$c$,2),
  ('custom-software','process',$c$3. التصميم والهندسة$c$,$c$3. Architecture$c$,3),
  ('custom-software','process',$c$4. التطوير$c$,$c$4. Development$c$,4),
  ('custom-software','process',$c$5. الاختبار$c$,$c$5. Testing$c$,5),
  ('custom-software','process',$c$6. الإطلاق$c$,$c$6. Deployment$c$,6),
  ('custom-software','process',$c$7. الدعم والتطوير المستمر$c$,$c$7. Ongoing Support$c$,7),

  ('custom-software','technology',$c$Laravel$c$,$c$Laravel$c$,1),
  ('custom-software','technology',$c$Node.js$c$,$c$Node.js$c$,2),
  ('custom-software','technology',$c$.NET$c$,$c$.NET$c$,3),
  ('custom-software','technology',$c$React$c$,$c$React$c$,4),
  ('custom-software','technology',$c$Vue.js$c$,$c$Vue.js$c$,5),
  ('custom-software','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,6),
  ('custom-software','technology',$c$MySQL$c$,$c$MySQL$c$,7),
  ('custom-software','technology',$c$REST APIs$c$,$c$REST APIs$c$,8),
  ('custom-software','technology',$c$GraphQL$c$,$c$GraphQL$c$,9),
  ('custom-software','technology',$c$Docker$c$,$c$Docker$c$,10),

  -- ===== Mobile Apps =====
  ('mobile-apps','feature',$c$Android$c$,$c$Android$c$,1),
  ('mobile-apps','feature',$c$iOS$c$,$c$iOS$c$,2),
  ('mobile-apps','feature',$c$Cross-platform development$c$,$c$Cross-platform development$c$,3),
  ('mobile-apps','feature',$c$Push Notifications$c$,$c$Push notifications$c$,4),
  ('mobile-apps','feature',$c$Authentication$c$,$c$Authentication$c$,5),
  ('mobile-apps','feature',$c$Payment integration$c$,$c$Payment integration$c$,6),
  ('mobile-apps','feature',$c$Maps$c$,$c$Maps$c$,7),
  ('mobile-apps','feature',$c$APIs$c$,$c$APIs$c$,8),
  ('mobile-apps','feature',$c$Realtime features$c$,$c$Realtime functionality$c$,9),
  ('mobile-apps','feature',$c$Analytics$c$,$c$Analytics$c$,10),

  ('mobile-apps','benefit',$c$الوصول للعملاء عبر الهاتف$c$,$c$Reach customers through mobile$c$,1),
  ('mobile-apps','benefit',$c$تجربة مستخدم أفضل$c$,$c$Improve user experience$c$,2),
  ('mobile-apps','benefit',$c$زيادة التفاعل$c$,$c$Increase engagement$c$,3),
  ('mobile-apps','benefit',$c$تقديم خدمات رقمية بسهولة$c$,$c$Deliver services more conveniently$c$,4),
  ('mobile-apps','benefit',$c$بناء قناة مباشرة مع العملاء$c$,$c$Build a direct customer channel$c$,5),

  ('mobile-apps','process',$c$1. دراسة الفكرة$c$,$c$1. Discovery$c$,1),
  ('mobile-apps','process',$c$2. تصميم التجربة والواجهات$c$,$c$2. UX/UI Design$c$,2),
  ('mobile-apps','process',$c$3. التطوير$c$,$c$3. Development$c$,3),
  ('mobile-apps','process',$c$4. الاختبار$c$,$c$4. Testing$c$,4),
  ('mobile-apps','process',$c$5. النشر$c$,$c$5. Publishing$c$,5),
  ('mobile-apps','process',$c$6. الدعم والتحديثات$c$,$c$6. Ongoing Support$c$,6),

  ('mobile-apps','technology',$c$Flutter$c$,$c$Flutter$c$,1),
  ('mobile-apps','technology',$c$React Native$c$,$c$React Native$c$,2),
  ('mobile-apps','technology',$c$Kotlin$c$,$c$Kotlin$c$,3),
  ('mobile-apps','technology',$c$Swift$c$,$c$Swift$c$,4),
  ('mobile-apps','technology',$c$Firebase$c$,$c$Firebase$c$,5),
  ('mobile-apps','technology',$c$REST APIs$c$,$c$REST APIs$c$,6),
  ('mobile-apps','technology',$c$Push Notifications$c$,$c$Push Notifications$c$,7)

) as v(slug, kind, ar, en, sort) on s.slug = v.slug;
