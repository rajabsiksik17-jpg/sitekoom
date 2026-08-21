-- ============================================================================
-- Sitekoom — Content population (Services 5-8)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Service 5: ERP Systems
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'erp-systems',
  'أنظمة ERP وإدارة موارد المؤسسات',
  'ERP Systems',
  'layout-dashboard',
  $c$حلول ERP تساعد الشركات على إدارة العمليات والموارد والبيانات من منصة واحدة.$c$,
  $c$Integrated ERP solutions that help businesses manage operations, resources and data from one platform.$c$,
  $c$<p>تساعد أنظمة ERP الشركات على ربط العمليات المختلفة داخل نظام موحد بدل الاعتماد على أدوات منفصلة.</p><p>في Sitekoom يمكننا تطوير أو تخصيص أنظمة ERP لتناسب طبيعة المؤسسة، بما يشمل المبيعات والمشتريات والمخزون والموارد البشرية والمحاسبة والفروع والتقارير وغيرها.</p><p>يتم تصميم النظام حسب احتياجات المؤسسة وعدد المستخدمين وطبيعة العمليات.</p>$c$,
  $c$<p>ERP systems help organizations connect their core business processes within a centralized platform instead of relying on disconnected tools.</p><p>At Sitekoom, we develop and customize ERP solutions around your organization, including sales, purchasing, inventory, HR, accounting, branches, reporting and more.</p><p>The system is designed around your operational requirements, users and business structure.</p>$c$,
  'published', 5, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;

-- ---------------------------------------------------------------------------
-- Service 6: POS Systems
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'pos-systems',
  'أنظمة نقاط البيع POS',
  'Point of Sale Systems',
  'store',
  $c$أنظمة نقاط بيع تساعدك على إدارة المبيعات والمخزون والفروع والعملاء بكفاءة أعلى.$c$,
  $c$Smart POS systems that help businesses manage sales, inventory, branches and customers efficiently.$c$,
  $c$<p>نطور أنظمة POS مصممة لتسهيل عمليات البيع اليومية وإدارة المنتجات والمخزون والفروع.</p><p>يمكن للنظام أن يدعم عمليات البيع، الفواتير، المنتجات، المخزون، الموظفين، الصلاحيات والتقارير، مع إمكانية ربطه بأنظمة ERP والمتاجر الإلكترونية.</p>$c$,
  $c$<p>We develop POS systems designed to simplify daily sales operations and provide better control over products, inventory and branches.</p><p>The system can support sales, invoices, products, inventory, employees, permissions and reporting, with integrations to ERP systems and e-commerce platforms.</p>$c$,
  'published', 6, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;

-- ---------------------------------------------------------------------------
-- Service 7: CRM Systems
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'crm-systems',
  'أنظمة CRM وإدارة علاقات العملاء',
  'CRM Systems',
  'users',
  $c$نساعد الشركات على تنظيم العملاء والفرص والمبيعات والتواصل من خلال نظام CRM متكامل.$c$,
  $c$Manage customers, leads, sales opportunities and follow-ups through a centralized CRM platform.$c$,
  $c$<p>يساعد CRM الشركات على تنظيم دورة حياة العميل منذ أول تواصل وحتى إتمام البيع والمتابعة بعد البيع.</p><p>يمكن بناء النظام لإدارة العملاء، العملاء المحتملين، المبيعات، الموظفين، المهام، الملاحظات، المتابعات والتقارير.</p>$c$,
  $c$<p>A CRM system helps businesses manage the customer journey from the first interaction through sales and ongoing follow-up.</p><p>We can develop CRM solutions for customers, leads, sales pipelines, tasks, notes, employees, follow-ups and reporting.</p>$c$,
  'published', 7, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;

-- ---------------------------------------------------------------------------
-- Service 8: Business & Management Systems
-- ---------------------------------------------------------------------------
insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, status, sort, is_featured)
values (
  'administrative-systems',
  'الأنظمة الإدارية وحلول الأعمال',
  'Business & Management Systems',
  'settings',
  $c$أنظمة رقمية مخصصة تساعد الشركات على أتمتة العمليات وإدارة أعمالها بكفاءة.$c$,
  $c$Custom business systems designed to automate operations and improve organizational efficiency.$c$,
  $c$<p>لكل شركة طريقة مختلفة في إدارة أعمالها، ولذلك قد لا تكون الحلول الجاهزة مناسبة دائمًا.</p><p>في Sitekoom نطور أنظمة إدارية مخصصة تساعد الشركات على أتمتة العمليات وإدارة البيانات والموظفين والمخزون والطلبات والتقارير وغيرها.</p>$c$,
  $c$<p>Every organization operates differently, which means off-the-shelf software may not always fit its workflow.</p><p>At Sitekoom, we build custom management systems that help businesses automate processes and manage employees, inventory, requests, reporting and other operational data.</p>$c$,
  'published', 8, true
)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en;
