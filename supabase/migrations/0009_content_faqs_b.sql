-- ============================================================================
-- Sitekoom — Content population (Service FAQs 5-8)
-- ============================================================================

delete from public.service_faqs
where service_id in (select id from public.services where slug in ('erp-systems','pos-systems','crm-systems','administrative-systems'));

insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort)
select s.id, v.q_ar, v.q_en, v.a_ar, v.a_en, v.sort
from public.services s
join (values

  -- ===== ERP Systems =====
  ('erp-systems',$c$هل يمكن تخصيص ERP حسب الشركة؟$c$,$c$Can an ERP system be customized?$c$,
   $c$نعم، يمكن تخصيص النظام وفق العمليات الفعلية للشركة.$c$,
   $c$Yes. ERP solutions can be customized around your actual business processes.$c$,1),
  ('erp-systems',$c$هل يدعم عدة فروع؟$c$,$c$Can it support multiple branches?$c$,
   $c$يمكن بناء النظام لدعم الفروع والمستخدمين والصلاحيات المختلفة.$c$,
   $c$Yes. Multi-branch architecture, users and permissions can be supported.$c$,2),
  ('erp-systems',$c$هل يمكن ربط ERP مع المتجر؟$c$,$c$Can ERP connect to an e-commerce store?$c$,
   $c$نعم، يمكن ربط ERP مع المتاجر والمواقع والتطبيقات والأنظمة الأخرى.$c$,
   $c$Yes. ERP systems can integrate with websites, stores, mobile applications and other business platforms.$c$,3),
  ('erp-systems',$c$كم يستغرق تنفيذ نظام ERP؟$c$,$c$How long does ERP implementation take?$c$,
   $c$تعتمد المدة على عدد الوحدات والعمليات المطلوبة، ويتم تحديد خطة تنفيذ واضحة بعد دراسة المتطلبات.$c$,
   $c$The timeline depends on the number of modules and processes involved. A clear implementation plan is defined after reviewing requirements.$c$,4),
  ('erp-systems',$c$هل توفرون تدريبًا للموظفين؟$c$,$c$Do you provide employee training?$c$,
   $c$نعم، نوفر تدريبًا للفريق على استخدام النظام وإدارته.$c$,
   $c$Yes. We provide training for your team on using and managing the system.$c$,5),

  -- ===== POS Systems =====
  ('pos-systems',$c$هل يدعم النظام أكثر من فرع؟$c$,$c$Can the POS support multiple branches?$c$,
   $c$نعم، يمكن بناء النظام لدعم الفروع والمستخدمين والصلاحيات.$c$,
   $c$Yes. Multi-branch POS architecture can be implemented.$c$,1),
  ('pos-systems',$c$هل يمكن ربط POS بالمخزون؟$c$,$c$Can POS connect to inventory?$c$,
   $c$نعم، يمكن ربط المبيعات مباشرة بالمخزون.$c$,
   $c$Yes. Sales can be synchronized with inventory management.$c$,2),
  ('pos-systems',$c$هل يمكن ربط POS مع ERP؟$c$,$c$Can POS integrate with ERP?$c$,
   $c$نعم، يمكن بناء تكامل مباشر مع ERP.$c$,
   $c$Yes. POS systems can be integrated with ERP platforms.$c$,3),
  ('pos-systems',$c$هل يعمل النظام بدون إنترنت؟$c$,$c$Does the system work offline?$c$,
   $c$يمكن دعم العمل دون اتصال مع مزامنة البيانات عند توفر الإنترنت حسب متطلبات المشروع.$c$,
   $c$Offline operation can be supported with data synchronization when connectivity is available, depending on project requirements.$c$,4),
  ('pos-systems',$c$هل تقدمون تدريبًا للكاشير؟$c$,$c$Do you provide cashier training?$c$,
   $c$نعم، نوفر تدريبًا عمليًا للموظفين على استخدام النظام.$c$,
   $c$Yes. We provide practical training for staff on using the system.$c$,5),

  -- ===== CRM Systems =====
  ('crm-systems',$c$هل يمكن تخصيص CRM؟$c$,$c$Can the CRM be customized?$c$,
   $c$نعم، يمكن تصميمه وفق دورة المبيعات الخاصة بالشركة.$c$,
   $c$Yes. We can build the CRM around your sales process.$c$,1),
  ('crm-systems',$c$هل يمكن ربطه بالموقع؟$c$,$c$Can it connect to our website?$c$,
   $c$نعم، يمكن استقبال Leads من الموقع مباشرة داخل CRM.$c$,
   $c$Yes. Website leads can be sent directly to the CRM.$c$,2),
  ('crm-systems',$c$هل يمكن ربطه بالمتجر؟$c$,$c$Can it integrate with an e-commerce store?$c$,
   $c$نعم، يمكن دمجه مع المتاجر والأنظمة الأخرى.$c$,
   $c$Yes. CRM systems can integrate with stores and other business platforms.$c$,3),
  ('crm-systems',$c$هل يمكن تصدير تقارير المبيعات؟$c$,$c$Can sales reports be exported?$c$,
   $c$نعم، يمكن تصدير التقارير بصيغ مناسبة مثل CSV وExcel.$c$,
   $c$Yes. Reports can be exported to suitable formats such as CSV and Excel.$c$,4),
  ('crm-systems',$c$هل يمكن الوصول للنظام من عدة أجهزة؟$c$,$c$Can the system be accessed from multiple devices?$c$,
   $c$نعم، يمكن الوصول للنظام من المتصفح على عدة أجهزة مع إدارة الصلاحيات.$c$,
   $c$Yes. The system can be accessed from a browser on multiple devices with permission management.$c$,5),

  -- ===== Business & Management Systems =====
  ('administrative-systems',$c$هل يمكن بناء نظام خاص لنشاط معين؟$c$,$c$Can you build a system specifically for our industry?$c$,
   $c$نعم، يمكن تصميم النظام وفق طبيعة النشاط والعمليات الداخلية.$c$,
   $c$Yes. Systems can be designed around your industry and internal workflows.$c$,1),
  ('administrative-systems',$c$هل يمكن ربط النظام بأجهزة أو خدمات خارجية؟$c$,$c$Can the system integrate with external devices or services?$c$,
   $c$نعم، يمكن بناء التكاملات المطلوبة حسب التقنية المتاحة.$c$,
   $c$Yes. Required integrations can be developed depending on the available technology.$c$,2),
  ('administrative-systems',$c$هل يمكن إضافة صلاحيات للمستخدمين؟$c$,$c$Can user permissions be configured?$c$,
   $c$نعم، يمكن تحديد أدوار وصلاحيات لكل مستخدم حسب مسؤوليته.$c$,
   $c$Yes. Roles and permissions can be configured for each user based on their responsibilities.$c$,3),
  ('administrative-systems',$c$هل يمكن ربط النظام بأنظمة أخرى؟$c$,$c$Can the system integrate with other systems?$c$,
   $c$نعم، يمكن بناء تكاملات مع أنظمة أخرى داخل المؤسسة.$c$,
   $c$Yes. Integrations can be built with other systems within your organization.$c$,4),
  ('administrative-systems',$c$هل تقدمون الدعم الفني؟$c$,$c$Do you provide technical support?$c$,
   $c$نعم، نوفر دعمًا فنيًا وصيانة مستمرة حسب الاتفاق.$c$,
   $c$Yes. We provide technical support and ongoing maintenance according to the agreement.$c$,5)

) as v(slug, q_ar, q_en, a_ar, a_en, sort) on s.slug = v.slug;
