-- Marketing services: features / benefits / process / technologies / FAQs (6-10)
do $$
declare svc uuid;
begin
  -- 6. video-editing
  svc := (select id from public.services where slug='video-editing');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','scissors','مونتاج احترافي','Professional editing','مونتاج فيديوهات بجودة عالية.','High-quality video editing.',0),
    (svc,'feature','zap','موشن جرافيك','Motion graphics','رسوم متحركة وعناصر بصرية.','Animated graphics and visual elements.',1),
    (svc,'feature','image','تصحيح الألوان','Color correction','ضبط ألوان سينمائي احترافي.','Professional cinematic color grading.',2),
    (svc,'feature','settings','هندسة الصوت','Sound editing','تنقية وتحسين الصوت والموسيقى.','Sound cleanup and music.',3),
    (svc,'benefit','rocket','فيديو مصقول','Polished video','نتيجة نهائية جاهزة للنشر.','A polished publish-ready result.',0),
    (svc,'benefit','shield-check','هوية بصرية','Visual identity','مونتاج متناسق مع هويتك.','Editing consistent with your identity.',1),
    (svc,'process','search','الاستلام','Ingest','استلام اللقطات الخام.','Receive raw footage.',0),
    (svc,'process','scissors','المونتاج','Editing','تنفيذ المونتاج والموشن.','Execute editing and motion graphics.',1),
    (svc,'process','eye','المراجعة','Review','مراجعة العميل والتعديل.','Client review and revisions.',2),
    (svc,'process','rocket','التسليم','Delivery','تسليم النسخة النهائية.','Deliver the final version.',3),
    (svc,'technology','scissors','Premiere Pro','Premiere Pro','','',0),
    (svc,'technology','zap','After Effects','After Effects','','',1),
    (svc,'technology','image','DaVinci Resolve','DaVinci Resolve','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'كم عدد التعديلات المجانية؟','How many free revisions?','نوفر جولات تعديل محددة حسب الباقة.','We provide a set number of revision rounds per package.',0),
    (svc,'هل تستقبلون اللقطات عن بُعد؟','Do you accept footage remotely?','نعم، يمكن رفع اللقطات عبر رابط مباشر.','Yes, footage can be uploaded via a direct link.',1);

  -- 7. social-media-automation
  svc := (select id from public.services where slug='social-media-automation');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','bot','ردود تلقائية','Auto replies','ردود فورية على الرسائل.','Instant replies to messages.',0),
    (svc,'feature','file-text','ردود الأسئلة الشائعة','FAQ responses','أتمتة الرد على الاستفسارات المتكررة.','Automate frequent inquiries.',1),
    (svc,'feature','users','جمع العملاء','Lead collection','التقاط بيانات العملاء المحتملين.','Capture potential customer data.',2),
    (svc,'benefit','zap','استجابة 24/7','24/7 response','تواصل مستمر دون انقطاع.','Continuous communication.',0),
    (svc,'benefit','shield-check','تنظيم الرسائل','Message routing','توجيه الرسائل للفريق المناسب.','Route messages to the right team.',1),
    (svc,'process','search','الإعداد','Setup','ربط المنصات وتحديد القواعد.','Connect platforms and define rules.',0),
    (svc,'process','bot','الأتمتة','Automation','تفعيل الردود الآلية.','Activate auto replies.',1),
    (svc,'process','trending-up','المتابعة','Monitoring','متابعة الأداء وتحسينه.','Monitor and improve.',2),
    (svc,'technology','bot','Messenger','Messenger','','',0),
    (svc,'technology','bot','Instagram DM','Instagram DM','','',1),
    (svc,'technology','bot','WhatsApp','WhatsApp','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'هل يمكن نقل المحادثة لموظف بشري؟','Can a conversation be handed to a human?','نعم، عند الحاجة يتم توجيه المحادثة لفريق الدعم.','Yes, conversations can be routed to your support team.',0);

  -- 8. ai-social-assistant
  svc := (select id from public.services where slug='ai-social-assistant');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','zap','ردود ذكية','Smart replies','ردود مفهومة للسياق بالعربية والإنجليزية.','Context-aware replies in Arabic and English.',0),
    (svc,'feature','bot','تأهيل العملاء','Lead qualification','تأهيل العملاء المحتملين تلقائيًا.','Automatically qualify leads.',1),
    (svc,'feature','share-2','توجيه ذكي','Smart routing','توجيه المحادثات للفريق المناسب.','Route conversations intelligently.',2),
    (svc,'benefit','rocket','دعم أسرع','Faster support','حل استفسارات العملاء فورًا.','Resolve inquiries instantly.',0),
    (svc,'benefit','shield-check','دقة عالية','High accuracy','ردود دقيقة ومتسقة.','Accurate, consistent replies.',1),
    (svc,'process','search','التدريب','Training','تدريب النموذج على بياناتك.','Train the model on your data.',0),
    (svc,'process','zap','التفعيل','Activation','تفعيل المساعد على المنصات.','Activate the assistant.',1),
    (svc,'process','trending-up','التحسين','Optimization','تحسين الردود باستمرار.','Continuously improve replies.',2),
    (svc,'technology','zap','AI Assistant','AI Assistant','','',0),
    (svc,'technology','bot','Chatbots','Chatbots','','',1),
    (svc,'technology','file-text','NLP','NLP','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'هل يدعم المساعد اللغة العربية؟','Does the assistant support Arabic?','نعم، يدعم العربية والإنجليزية.','Yes, it supports Arabic and English.',0);

  -- 9. seo-content
  svc := (select id from public.services where slug='seo-content');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','search','بحث الكلمات المفتاحية','Keyword research','تحديد الكلمات الأكثر بحثًا.','Identify top search keywords.',0),
    (svc,'feature','file-text','مقالات SEO','SEO articles','كتابة مقالات متوافقة مع محركات البحث.','Search-optimized articles.',1),
    (svc,'feature','trending-up','تحسين المحتوى','Content optimization','تحسين المحتوى الحالي للظهور.','Optimize existing content.',2),
    (svc,'benefit','zap','ظهور أفضل','Better ranking','تحسين ترتيب موقعك في البحث.','Improve your search ranking.',0),
    (svc,'benefit','rocket','زيارات أكثر','More traffic','جذب زيارات مستهدفة.','Attract targeted traffic.',1),
    (svc,'process','search','البحث','Research','تحليل الكلمات والمنافسين.','Keyword and competitor analysis.',0),
    (svc,'process','pen-tool','الكتابة','Writing','كتابة المحتوى المحسن.','Write optimized content.',1),
    (svc,'process','trending-up','القياس','Measurement','قياس النتائج والتحسين.','Measure and improve.',2),
    (svc,'technology','search','SEO','SEO','','',0),
    (svc,'technology','file-text','Content Marketing','Content Marketing','','',1),
    (svc,'technology','trending-up','Analytics','Analytics','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'كم يستغرق ظهور النتائج؟','How long until results?','تحسين SEO عملية تراكمية، وتظهر النتائج خلال أسابيع لأشهر.','SEO is cumulative; results appear within weeks to months.',0);

  -- 10. digital-marketing-consulting
  svc := (select id from public.services where slug='digital-marketing-consulting');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','search','تحليل السوق','Market analysis','تحليل السوق والمنافسين.','Market and competitor analysis.',0),
    (svc,'feature','target','استراتيجية رقمية','Digital strategy','بناء استراتيجية تسويق متكاملة.','Build a complete marketing strategy.',1),
    (svc,'feature','trending-up','خطط النمو','Growth plans','خطط نمو قابلة للتنفيذ.','Actionable growth plans.',2),
    (svc,'benefit','shield-check','قرارات مدروسة','Informed decisions','قرارات مبنية على بيانات.','Data-driven decisions.',0),
    (svc,'benefit','rocket','نمو مستدام','Sustainable growth','استراتيجية تحقق نموًا طويل الأمد.','A strategy for long-term growth.',1),
    (svc,'process','search','التشخيص','Diagnosis','مراجعة الوضع الحالي.','Review current state.',0),
    (svc,'process','target','الاستراتيجية','Strategy','وضع الخطة والاستراتيجية.','Set the plan and strategy.',1),
    (svc,'process','trending-up','المتابعة','Follow-up','متابعة التنفيذ والتحسين.','Follow up and optimize.',2),
    (svc,'technology','search','Marketing Strategy','Marketing Strategy','','',0),
    (svc,'technology','trending-up','Analytics','Analytics','','',1),
    (svc,'technology','target','Growth Marketing','Growth Marketing','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'هل الاستشارة لمرة واحدة أم مستمرة؟','Is consulting one-time or ongoing?','نوفر استشارات فردية وباقات متابعة شهرية.','We offer one-time sessions and monthly retainer packages.',0);

  -- 11. influencer-marketing (extra)
  svc := (select id from public.services where slug='influencer-marketing');
  if svc is null then
    insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, category_id, status, sort, is_featured)
    values ('influencer-marketing', 'حملات المؤثرين', 'Influencer Campaigns', 'thumbs-up',
      'تخطيط وتنفيذ حملات مؤثرين تصل بعلامتك لجمهور أوسع.',
      'Plan and execute influencer campaigns that reach a wider audience.',
      '<p>نربط علامتك التجارية بمؤثرين مناسبين لبناء الثقة والوصول لجمهور أكبر.</p><ul><li>اختيار المؤثرين</li><li>إدارة الحملة</li><li>قياس النتائج</li></ul>',
      '<p>We connect your brand with the right influencers to build trust and reach a wider audience.</p><ul><li>Influencer selection</li><li>Campaign management</li><li>Results measurement</li></ul>',
      (select id from public.service_categories where slug='marketing'), 'published', 11, false)
    returning id into svc;
  end if;
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','thumbs-up','اختيار المؤثرين','Influencer selection','اختيار المؤثرين المناسبين لعلامتك.','Select the right influencers for your brand.',0),
    (svc,'feature','trending-up','قياس النتائج','Results measurement','قياس أثر الحملة بدقة.','Measure campaign impact.',1),
    (svc,'benefit','rocket','وصول أوسع','Wider reach','الوصول لجمهور جديد ومستهدف.','Reach new targeted audiences.',0),
    (svc,'process','search','التحديد','Selection','تحديد المؤثرين المناسبين.','Select suitable influencers.',0),
    (svc,'process','rocket','الإطلاق','Launch','إطلاق الحملة ومتابعتها.','Launch and monitor the campaign.',1),
    (svc,'process','trending-up','القياس','Measurement','قياس النتائج.','Measure results.',2);
end $$;
