-- Marketing services: features / benefits / process / technologies / FAQs (1-5)
do $$
declare svc uuid;
begin
  -- 1. social-media-management
  svc := (select id from public.services where slug='social-media-management');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','check-circle','خطة المحتوى','Content plan','إعداد خطة محتوى شهرية متكاملة لكل منصة.','A complete monthly content plan for each platform.',0),
    (svc,'feature','pen-tool','كتابة المنشورات','Post writing','كتابة منشورات جذابة بلغة علامتك التجارية.','Engaging posts written in your brand voice.',1),
    (svc,'feature','image','تصميم المنشورات','Post design','تصميم منشورات متناسقة مع هويتك البصرية.','Posts designed consistently with your visual identity.',2),
    (svc,'feature','trending-up','تقارير الأداء','Performance reports','تقارير دورية توضح النمو والتفاعل.','Regular reports showing growth and engagement.',3),
    (svc,'benefit','zap','توفير الوقت','Time saving','نوفر عليك وقت إدارة الحسابات يوميًا.','We save you the daily effort of managing accounts.',0),
    (svc,'benefit','users','نمو المتابعين','Audience growth','بناء جمهور مستهدف وتفاعل حقيقي.','Build a targeted audience with real engagement.',1),
    (svc,'benefit','shield-check','هوية متسقة','Consistent brand','حضور موحد واحترافي عبر كل المنصات.','A unified professional presence across all platforms.',2),
    (svc,'process','zap','التحليل','Analysis','فهم العلامة التجارية والجمهور المستهدف.','Understand the brand and target audience.',0),
    (svc,'process','pen-tool','التخطيط','Planning','إعداد خطة المحتوى والجدولة.','Prepare the content plan and schedule.',1),
    (svc,'process','rocket','النشر','Publishing','نشر المحتوى حسب الجدول الزمني.','Publish content on schedule.',2),
    (svc,'process','trending-up','التحسين','Optimization','قياس النتائج وتحسين الأداء.','Measure results and optimize performance.',3),
    (svc,'technology','share-2','Instagram','Instagram','','',0),
    (svc,'technology','share-2','Facebook','Facebook','','',1),
    (svc,'technology','share-2','TikTok','TikTok','','',2),
    (svc,'technology','share-2','LinkedIn','LinkedIn','','',3);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'كم عدد المنشورات شهريًا؟','How many posts per month?','يعتمد على الباقة المختارة، ونحدد العدد الأمثل حسب منصتك وجمهورك.','It depends on the chosen package; we define the optimal number per platform and audience.',0),
    (svc,'هل تكتبون المحتوى أم نرسله لكم؟','Do you write the content?','نعم، نكتب ونصمم المنشورات بالكامل ويمكنك مراجعتها قبل النشر.','Yes, we fully write and design posts and you can review before publishing.',1),
    (svc,'هل تشمل الخدمة الرد على التعليقات؟','Does it include replies?','نعم، تشمل متابعة التفاعل والرد على التعليقات والرسائل.','Yes, it includes engagement and replying to comments and messages.',2);

  -- 2. content-creation
  svc := (select id from public.services where slug='content-creation');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','target','استراتيجية المحتوى','Content strategy','بناء استراتيجية محتوى تحقق أهدافك.','A content strategy that meets your goals.',0),
    (svc,'feature','pen-tool','كتابة احترافية','Copywriting','كتابة منشورات ومقالات وإعلانات.','Posts, articles and ads writing.',1),
    (svc,'feature','zap','أفكار Reels و Stories','Reels & Stories ideas','أفكار محتوى قصير جاهزة للتنفيذ.','Ready short-form content ideas.',2),
    (svc,'benefit','rocket','تفاعل أعلى','Higher engagement','محتوى يجذب الانتباه ويزيد التفاعل.','Content that attracts attention and boosts engagement.',0),
    (svc,'benefit','shield-check','رسالة واضحة','Clear message','إيصال رسالة علامتك بوضوح.','Deliver your brand message clearly.',1),
    (svc,'process','search','البحث','Research','دراسة الجمهور والمنافسين.','Audience and competitor research.',0),
    (svc,'process','pen-tool','الكتابة','Writing','كتابة المحتوى والنسخة الإعلانية.','Writing content and ad copy.',1),
    (svc,'process','eye','المراجعة','Review','مراجعة وتحرير المحتوى.','Content review and editing.',2),
    (svc,'process','rocket','النشر','Publishing','تسليم المحتوى وجاهزيته للنشر.','Deliver publish-ready content.',3),
    (svc,'technology','file-text','Copywriting','Copywriting','','',0),
    (svc,'technology','image','Visual Content','Visual Content','','',1),
    (svc,'technology','search','SEO Content','SEO Content','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'هل تقدمون محتوى بالعربية والإنجليزية؟','Do you provide Arabic and English content?','نعم، نكتب المحتوى باللغتين حسب حاجة جمهورك.','Yes, we write content in both languages as needed.',0),
    (svc,'ما أنواع المحتوى التي تنتجونها؟','What content types do you produce?','منشورات ومقالات ومحتوى حملات وإعلانات وأفكار فيديو قصير.','Posts, articles, campaign and ad content, and short video ideas.',1),
    (svc,'هل يمكن طلب محتوى شهري مستمر؟','Can I request ongoing monthly content?','نعم، نوفر باقات محتوى شهرية متجددة.','Yes, we provide ongoing monthly content packages.',2);

  -- 3. paid-advertising
  svc := (select id from public.services where slug='paid-advertising');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','megaphone','إعلانات Meta','Meta Ads','إدارة إعلانات فيسبوك وإنستغرام.','Facebook and Instagram ads management.',0),
    (svc,'feature','search','إعلانات Google','Google Ads','حملات بحث وعرض على جوجل.','Google search and display campaigns.',1),
    (svc,'feature','target','الاستهداف','Audience targeting','استهداف دقيق للجمهور المناسب.','Precise audience targeting.',2),
    (svc,'feature','trending-up','تحسين التحويل','Conversion optimization','تحسين الحملات لرفع التحويلات.','Optimize campaigns to increase conversions.',3),
    (svc,'benefit','zap','عائد أعلى','Higher ROI','تحقيق أقصى عائد على الإنفاق الإعلاني.','Maximize return on ad spend.',0),
    (svc,'benefit','shield-check','إدارة الميزانية','Budget management','تحكم كامل بالميزانية والإنفاق.','Full control of budget and spending.',1),
    (svc,'process','search','التحليل','Analysis','تحليل السوق والجمهور.','Market and audience analysis.',0),
    (svc,'process','target','الإعداد','Setup','إنشاء الحملات والاستهداف.','Campaign and targeting setup.',1),
    (svc,'process','rocket','الإطلاق','Launch','إطلاق الحملات ومتابعتها.','Launch and monitor campaigns.',2),
    (svc,'process','trending-up','التحسين','Optimization','تحسين الأداء والتقارير.','Performance optimization and reporting.',3),
    (svc,'technology','megaphone','Meta Ads','Meta Ads','','',0),
    (svc,'technology','search','Google Ads','Google Ads','','',1),
    (svc,'technology','target','Retargeting','Retargeting','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'هل تتولون إدارة الميزانية كاملة؟','Do you fully manage the budget?','نعم، نخطط ونوزع الميزانية ونحسن الإنفاق باستمرار.','Yes, we plan, allocate and continuously optimize the budget.',0),
    (svc,'ما الحد الأدنى للميزانية الشهرية؟','What is the minimum monthly budget?','يعتمد على الأهداف، ونحدده بعد دراسة أولية.','It depends on the goals, determined after an initial study.',1),
    (svc,'هل أحصل على تقارير أداء؟','Do I get performance reports?','نعم، تقارير دورية بالنتائج والتحويلات.','Yes, regular reports on results and conversions.',2);

  -- 4. photography
  svc := (select id from public.services where slug='photography');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','camera','تصوير المنتجات','Product photography','صور منتجات احترافية للتجارة الإلكترونية.','Professional product images for e-commerce.',0),
    (svc,'feature','users','تصوير الشركات','Corporate photography','توثيق فريقك ومنشآتك باحتراف.','Professionally document your team and facilities.',1),
    (svc,'feature','image','تصوير الفعاليات','Event photography','تغطية الفعاليات والمشاريع.','Event and project coverage.',2),
    (svc,'benefit','shield-check','جودة عالية','High quality','صور واضحة تبرز علامتك.','Sharp images that showcase your brand.',0),
    (svc,'benefit','zap','تسليم سريع','Fast delivery','تسليم الصور بعد المعالجة.','Delivered after post-processing.',1),
    (svc,'process','search','التحضير','Preparation','تحديد المواقع والأهداف.','Define locations and objectives.',0),
    (svc,'process','camera','التصوير','Shooting','تنفيذ جلسة التصوير.','Execute the shooting session.',1),
    (svc,'process','image','المعالجة','Editing','معالجة وتحسين الصور.','Edit and enhance images.',2),
    (svc,'technology','camera','Product','Product','','',0),
    (svc,'technology','camera','Corporate','Corporate','','',1),
    (svc,'technology','camera','Events','Events','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'هل تقدمون التصوير في موقع العميل؟','Do you shoot on-site?','نعم، نصوّر في موقعك أو في الاستوديو حسب الحاجة.','Yes, we shoot on-site or in the studio as needed.',0),
    (svc,'كم تستغرق جلسة التصوير؟','How long is a session?','حسب نوع التصوير، ونحدد المدة مسبقًا.','Depends on the type; we agree on timing upfront.',1);

  -- 5. video-production
  svc := (select id from public.services where slug='video-production');
  delete from public.service_features where service_id = svc;
  insert into public.service_features (service_id, kind, icon, title_ar, title_en, description_ar, description_en, sort) values
    (svc,'feature','video','فيديوهات الشركات','Corporate videos','فيديوهات تعريفية عن شركتك.','Introductory videos about your company.',0),
    (svc,'feature','megaphone','الإعلانات','Advertisements','إعلانات فيديو جذابة.','Engaging video advertisements.',1),
    (svc,'feature','share-2','محتوى السوشيال','Social content','فيديوهات و Reels للسوشيال ميديا.','Videos and Reels for social media.',2),
    (svc,'benefit','rocket','قصة مؤثرة','Impactful story','فيديو يحكي قصة علامتك.','A video that tells your brand story.',0),
    (svc,'benefit','shield-check','جودة إنتاج','Production quality','إنتاج احترافي بأحدث المعدات.','Professional production with modern gear.',1),
    (svc,'process','search','الفكرة','Concept','تطوير الفكرة والسيناريو.','Develop concept and script.',0),
    (svc,'process','camera','التصوير','Filming','تنفيذ التصوير.','Execute filming.',1),
    (svc,'process','scissors','المونتاج','Editing','مونتاج وإخراج نهائي.','Editing and final delivery.',2),
    (svc,'technology','video','Corporate','Corporate','','',0),
    (svc,'technology','video','Reels','Reels','','',1),
    (svc,'technology','video','Commercials','Commercials','','',2);
  delete from public.service_faqs where service_id = svc;
  insert into public.service_faqs (service_id, question_ar, question_en, answer_ar, answer_en, sort) values
    (svc,'كم يستغرق إنتاج الفيديو؟','How long does production take?','حسب طول الفيديو وتعقيده، ونحدد جدولًا زمنيًا مسبقًا.','Depends on length and complexity; we agree on a timeline.',0),
    (svc,'هل تشمل الخدمة كتابة السيناريو؟','Does it include scripting?','نعم، نكتب السيناريو ونطور الفكرة معك.','Yes, we write the script and develop the concept with you.',1);
end $$;
