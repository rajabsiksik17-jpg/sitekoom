-- ============================================================================
-- Sitekoom — Content population (Service Features 5-8)
-- ============================================================================

delete from public.service_features
where service_id in (select id from public.services where slug in ('erp-systems','pos-systems','crm-systems','administrative-systems'));

insert into public.service_features (service_id, kind, title_ar, title_en, sort)
select s.id, v.kind, v.ar, v.en, v.sort
from public.services s
join (values

  -- ===== ERP Systems =====
  ('erp-systems','feature',$c$إدارة الموارد$c$,$c$Resource management$c$,1),
  ('erp-systems','feature',$c$المبيعات$c$,$c$Sales$c$,2),
  ('erp-systems','feature',$c$المشتريات$c$,$c$Purchasing$c$,3),
  ('erp-systems','feature',$c$المخزون$c$,$c$Inventory$c$,4),
  ('erp-systems','feature',$c$المحاسبة$c$,$c$Accounting$c$,5),
  ('erp-systems','feature',$c$الموارد البشرية$c$,$c$Human resources$c$,6),
  ('erp-systems','feature',$c$الفروع$c$,$c$Branch management$c$,7),
  ('erp-systems','feature',$c$المستخدمون والصلاحيات$c$,$c$Users and permissions$c$,8),
  ('erp-systems','feature',$c$التقارير$c$,$c$Reporting$c$,9),
  ('erp-systems','feature',$c$Dashboards$c$,$c$Dashboards$c$,10),
  ('erp-systems','feature',$c$Notifications$c$,$c$Notifications$c$,11),
  ('erp-systems','feature',$c$تكامل الأنظمة$c$,$c$System integrations$c$,12),

  ('erp-systems','benefit',$c$توحيد البيانات$c$,$c$Centralized data$c$,1),
  ('erp-systems','benefit',$c$تحسين اتخاذ القرار$c$,$c$Better decision making$c$,2),
  ('erp-systems','benefit',$c$تقليل العمل اليدوي$c$,$c$Less manual work$c$,3),
  ('erp-systems','benefit',$c$رفع كفاءة العمليات$c$,$c$Improved operational efficiency$c$,4),
  ('erp-systems','benefit',$c$تقليل الأخطاء$c$,$c$Fewer errors$c$,5),
  ('erp-systems','benefit',$c$متابعة أداء المؤسسة$c$,$c$Better business visibility$c$,6),

  ('erp-systems','process',$c$1. تحليل العمليات$c$,$c$1. Analysis$c$,1),
  ('erp-systems','process',$c$2. التصميم والهندسة$c$,$c$2. Architecture$c$,2),
  ('erp-systems','process',$c$3. التطوير$c$,$c$3. Development$c$,3),
  ('erp-systems','process',$c$4. ترحيل البيانات$c$,$c$4. Data Migration$c$,4),
  ('erp-systems','process',$c$5. الاختبار$c$,$c$5. Testing$c$,5),
  ('erp-systems','process',$c$6. الإطلاق$c$,$c$6. Deployment$c$,6),
  ('erp-systems','process',$c$7. التدريب$c$,$c$7. Training$c$,7),
  ('erp-systems','process',$c$8. الدعم المستمر$c$,$c$8. Ongoing Support$c$,8),

  ('erp-systems','technology',$c$Laravel$c$,$c$Laravel$c$,1),
  ('erp-systems','technology',$c$.NET$c$,$c$.NET$c$,2),
  ('erp-systems','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,3),
  ('erp-systems','technology',$c$MySQL$c$,$c$MySQL$c$,4),
  ('erp-systems','technology',$c$REST APIs$c$,$c$REST APIs$c$,5),
  ('erp-systems','technology',$c$Cloud Infrastructure$c$,$c$Cloud Infrastructure$c$,6),
  ('erp-systems','technology',$c$Docker$c$,$c$Docker$c$,7),

  -- ===== POS Systems =====
  ('pos-systems','feature',$c$إدارة المبيعات$c$,$c$Sales management$c$,1),
  ('pos-systems','feature',$c$الفواتير$c$,$c$Invoicing$c$,2),
  ('pos-systems','feature',$c$المنتجات$c$,$c$Product management$c$,3),
  ('pos-systems','feature',$c$المخزون$c$,$c$Inventory$c$,4),
  ('pos-systems','feature',$c$العملاء$c$,$c$Customers$c$,5),
  ('pos-systems','feature',$c$الموظفون$c$,$c$Employees$c$,6),
  ('pos-systems','feature',$c$الفروع$c$,$c$Branches$c$,7),
  ('pos-systems','feature',$c$التقارير$c$,$c$Reports$c$,8),
  ('pos-systems','feature',$c$الصلاحيات$c$,$c$Permissions$c$,9),
  ('pos-systems','feature',$c$التكامل مع ERP$c$,$c$ERP integration$c$,10),
  ('pos-systems','feature',$c$التكامل مع المتجر الإلكتروني$c$,$c$E-commerce integration$c$,11),

  ('pos-systems','benefit',$c$تسريع عمليات البيع$c$,$c$Faster sales operations$c$,1),
  ('pos-systems','benefit',$c$تقليل الأخطاء$c$,$c$Fewer errors$c$,2),
  ('pos-systems','benefit',$c$معرفة المخزون$c$,$c$Better inventory visibility$c$,3),
  ('pos-systems','benefit',$c$متابعة أداء الفروع$c$,$c$Branch performance tracking$c$,4),
  ('pos-systems','benefit',$c$تقارير أفضل$c$,$c$Better reporting$c$,5),
  ('pos-systems','benefit',$c$إدارة مركزية$c$,$c$Centralized management$c$,6),

  ('pos-systems','process',$c$1. تحليل المتطلبات$c$,$c$1. Analysis$c$,1),
  ('pos-systems','process',$c$2. التصميم$c$,$c$2. Design$c$,2),
  ('pos-systems','process',$c$3. التطوير$c$,$c$3. Development$c$,3),
  ('pos-systems','process',$c$4. ربط الأجهزة$c$,$c$4. Hardware Integration$c$,4),
  ('pos-systems','process',$c$5. الاختبار$c$,$c$5. Testing$c$,5),
  ('pos-systems','process',$c$6. الإطلاق$c$,$c$6. Deployment$c$,6),
  ('pos-systems','process',$c$7. التدريب$c$,$c$7. Training$c$,7),

  ('pos-systems','technology',$c$React$c$,$c$React$c$,1),
  ('pos-systems','technology',$c$Laravel$c$,$c$Laravel$c$,2),
  ('pos-systems','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,3),
  ('pos-systems','technology',$c$MySQL$c$,$c$MySQL$c$,4),
  ('pos-systems','technology',$c$REST APIs$c$,$c$REST APIs$c$,5),
  ('pos-systems','technology',$c$Barcode & Receipt Integration$c$,$c$Barcode & Receipt Integration$c$,6),

  -- ===== CRM Systems =====
  ('crm-systems','feature',$c$إدارة العملاء$c$,$c$Customer management$c$,1),
  ('crm-systems','feature',$c$Leads$c$,$c$Leads$c$,2),
  ('crm-systems','feature',$c$Sales Pipeline$c$,$c$Sales pipeline$c$,3),
  ('crm-systems','feature',$c$Tasks$c$,$c$Tasks$c$,4),
  ('crm-systems','feature',$c$Follow-ups$c$,$c$Follow-ups$c$,5),
  ('crm-systems','feature',$c$Notes$c$,$c$Notes$c$,6),
  ('crm-systems','feature',$c$Notifications$c$,$c$Notifications$c$,7),
  ('crm-systems','feature',$c$Reports$c$,$c$Reports$c$,8),
  ('crm-systems','feature',$c$Employee assignment$c$,$c$Employee assignment$c$,9),
  ('crm-systems','feature',$c$Customer history$c$,$c$Customer history$c$,10),

  ('crm-systems','benefit',$c$تنظيم بيانات العملاء$c$,$c$Organized customer data$c$,1),
  ('crm-systems','benefit',$c$تحسين المتابعة$c$,$c$Better follow-up$c$,2),
  ('crm-systems','benefit',$c$زيادة فرص البيع$c$,$c$More sales opportunities$c$,3),
  ('crm-systems','benefit',$c$تقليل ضياع العملاء المحتملين$c$,$c$Fewer lost leads$c$,4),
  ('crm-systems','benefit',$c$رؤية أفضل للمبيعات$c$,$c$Better sales visibility$c$,5),

  ('crm-systems','process',$c$1. تحليل المتطلبات$c$,$c$1. Analysis$c$,1),
  ('crm-systems','process',$c$2. التصميم$c$,$c$2. Design$c$,2),
  ('crm-systems','process',$c$3. التطوير$c$,$c$3. Development$c$,3),
  ('crm-systems','process',$c$4. التكامل مع الأنظمة$c$,$c$4. Integration$c$,4),
  ('crm-systems','process',$c$5. الاختبار$c$,$c$5. Testing$c$,5),
  ('crm-systems','process',$c$6. الإطلاق$c$,$c$6. Deployment$c$,6),
  ('crm-systems','process',$c$7. التدريب$c$,$c$7. Training$c$,7),

  ('crm-systems','technology',$c$Laravel$c$,$c$Laravel$c$,1),
  ('crm-systems','technology',$c$React$c$,$c$React$c$,2),
  ('crm-systems','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,3),
  ('crm-systems','technology',$c$MySQL$c$,$c$MySQL$c$,4),
  ('crm-systems','technology',$c$REST APIs$c$,$c$REST APIs$c$,5),
  ('crm-systems','technology',$c$Email & SMS Integration$c$,$c$Email & SMS Integration$c$,6),

  -- ===== Business & Management Systems =====
  ('administrative-systems','feature',$c$أنظمة الموارد البشرية$c$,$c$HR systems$c$,1),
  ('administrative-systems','feature',$c$إدارة الموظفين$c$,$c$Employee management$c$,2),
  ('administrative-systems','feature',$c$الحضور والانصراف$c$,$c$Attendance$c$,3),
  ('administrative-systems','feature',$c$الإجازات$c$,$c$Leave management$c$,4),
  ('administrative-systems','feature',$c$الرواتب$c$,$c$Payroll$c$,5),
  ('administrative-systems','feature',$c$إدارة المخزون$c$,$c$Inventory$c$,6),
  ('administrative-systems','feature',$c$إدارة المشتريات$c$,$c$Purchasing$c$,7),
  ('administrative-systems','feature',$c$إدارة الطلبات$c$,$c$Request management$c$,8),
  ('administrative-systems','feature',$c$التقارير$c$,$c$Reporting$c$,9),
  ('administrative-systems','feature',$c$الصلاحيات$c$,$c$Permissions$c$,10),
  ('administrative-systems','feature',$c$Dashboards$c$,$c$Dashboards$c$,11),

  ('administrative-systems','benefit',$c$أتمتة العمليات$c$,$c$Process automation$c$,1),
  ('administrative-systems','benefit',$c$تقليل العمل اليدوي$c$,$c$Less manual work$c$,2),
  ('administrative-systems','benefit',$c$تحسين إدارة البيانات$c$,$c$Better data management$c$,3),
  ('administrative-systems','benefit',$c$رفع كفاءة الموظفين$c$,$c$Improved employee efficiency$c$,4),
  ('administrative-systems','benefit',$c$تقليل الأخطاء$c$,$c$Fewer operational errors$c$,5),

  ('administrative-systems','process',$c$1. تحليل المتطلبات$c$,$c$1. Analysis$c$,1),
  ('administrative-systems','process',$c$2. التصميم$c$,$c$2. Design$c$,2),
  ('administrative-systems','process',$c$3. التطوير$c$,$c$3. Development$c$,3),
  ('administrative-systems','process',$c$4. التكامل مع الأنظمة$c$,$c$4. Integration$c$,4),
  ('administrative-systems','process',$c$5. الاختبار$c$,$c$5. Testing$c$,5),
  ('administrative-systems','process',$c$6. الإطلاق$c$,$c$6. Deployment$c$,6),
  ('administrative-systems','process',$c$7. التدريب$c$,$c$7. Training$c$,7),

  ('administrative-systems','technology',$c$Laravel$c$,$c$Laravel$c$,1),
  ('administrative-systems','technology',$c$Node.js$c$,$c$Node.js$c$,2),
  ('administrative-systems','technology',$c$React$c$,$c$React$c$,3),
  ('administrative-systems','technology',$c$PostgreSQL$c$,$c$PostgreSQL$c$,4),
  ('administrative-systems','technology',$c$MySQL$c$,$c$MySQL$c$,5),
  ('administrative-systems','technology',$c$REST APIs$c$,$c$REST APIs$c$,6),
  ('administrative-systems','technology',$c$Docker$c$,$c$Docker$c$,7)

) as v(slug, kind, ar, en, sort) on s.slug = v.slug;
