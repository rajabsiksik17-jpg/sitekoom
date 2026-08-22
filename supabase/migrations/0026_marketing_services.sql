-- ============================================================================
-- Sitekoom — Marketing & Digital Media services (under "marketing" category)
-- ============================================================================

insert into public.services (slug, title_ar, title_en, icon, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, category_id, status, sort, is_featured) values
('social-media-management', 'إدارة حسابات التواصل الاجتماعي', 'Social Media Management', 'share-2',
 'إدارة متكاملة لحساباتك على السوشيال ميديا من التخطيط والنشر إلى التفاعل وتقارير الأداء.',
 'Full management of your social media accounts — from planning and publishing to engagement and performance reports.',
 '<p>نأخذ إدارة حساباتك على مواقع التواصل الاجتماعي على عاتقنا بالكامل، فنبني لك حضورًا رقميًا احترافيًا يعكس هوية علامتك التجارية.</p><ul><li>إعداد خطة المحتوى الشهرية</li><li>كتابة وتصميم المنشورات</li><li>جدولة المحتوى ونشره</li><li>متابعة التفاعل والردود</li><li>تقارير أداء دورية</li></ul>',
 '<p>We take full ownership of your social media accounts and build a professional digital presence that reflects your brand identity.</p><ul><li>Monthly content planning</li><li>Post writing and design</li><li>Content scheduling and publishing</li><li>Engagement and replies</li><li>Regular performance reports</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 1, true),

('content-creation', 'صناعة المحتوى', 'Content Creation', 'pen-tool',
 'صناعة محتوى رقمي متكامل يشمل الاستراتيجية والكتابة والتصميم وأفكار المحتوى القصير.',
 'Complete digital content production covering strategy, copywriting, design and short-form content ideas.',
 '<p>نصنع محتوى رقميًا يلفت الانتباه ويبني علاقة مع جمهورك، بدءًا من استراتيجية المحتوى وحتى النشر.</p><ul><li>استراتيجية المحتوى</li><li>كتابة المنشورات والمقالات</li><li>محتوى الحملات الإعلانية</li><li>أفكار Reels و Stories</li><li>Copywriting احترافي</li></ul>',
 '<p>We create digital content that captures attention and builds a relationship with your audience — from content strategy to publishing.</p><ul><li>Content strategy</li><li>Posts and articles writing</li><li>Campaign content</li><li>Reels and Stories ideas</li><li>Professional copywriting</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 2, true),

('paid-advertising', 'تمويل وإدارة الحملات الإعلانية', 'Paid Advertising & Campaign Management', 'megaphone',
 'إدارة حملات إعلانية مدفوعة على Meta وGoogle مع الاستهداف وإدارة الميزانية وتحسين الأداء.',
 'Paid advertising across Meta and Google with targeting, budget management and performance optimization.',
 '<p>ندير حملاتك الإعلانية المدفوعة على أهم المنصات لتحقيق أعلى عائد على الاستثمار.</p><ul><li>Meta Ads و Instagram Ads و Facebook Ads</li><li>Google Ads</li><li>استراتيجية الحملة والاستهداف</li><li>إدارة الميزانية</li><li>تحسين الأداء والتحويلات</li></ul>',
 '<p>We manage your paid campaigns across the top platforms to maximize return on investment.</p><ul><li>Meta Ads, Instagram Ads and Facebook Ads</li><li>Google Ads</li><li>Campaign strategy and targeting</li><li>Budget management</li><li>Performance and conversion optimization</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 3, true),

('photography', 'التصوير الاحترافي', 'Professional Photography', 'camera',
 'تصوير منتجات وشركات ومشاريع وفعاليات ومحتوى سوشيال ميديا بجودة احترافية.',
 'Professional product, corporate, project, event and social media photography.',
 '<p>نقدم خدمات تصوير احترافية تلبي احتياجات علامتك التجارية وتبرز منتجاتك وخدماتك بأفضل صورة.</p><ul><li>تصوير المنتجات</li><li>تصوير الشركات</li><li>تصوير المشاريع والفعاليات</li><li>تصوير محتوى السوشيال ميديا</li></ul>',
 '<p>We provide professional photography services that serve your brand and showcase your products and services.</p><ul><li>Product photography</li><li>Corporate photography</li><li>Project and event photography</li><li>Social media content photography</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 4, true),

('video-production', 'تصوير وإنتاج الفيديو', 'Video Production', 'video',
 'إنتاج فيديوهات احترافية للشركات والمنتجات والإعلانات ومحتوى السوشيال ميديا.',
 'Professional video production for corporate, product, ads and social media content.',
 '<p>ننتج فيديوهات احترافية تحكي قصة علامتك التجارية وتجذب جمهورك.</p><ul><li>فيديوهات الشركات</li><li>فيديوهات المنتجات</li><li>الإعلانات</li><li>Reels ومحتوى السوشيال ميديا</li></ul>',
 '<p>We produce professional videos that tell your brand story and engage your audience.</p><ul><li>Corporate videos</li><li>Product videos</li><li>Advertisements</li><li>Reels and social media content</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 5, true),

('video-editing', 'مونتاج الفيديو', 'Video Editing & Motion Graphics', 'scissors',
 'مونتاج فيديو احترافي مع موشن جرافيك وتصحيح ألوان وهندسة صوت.',
 'Professional video editing with motion graphics, color correction and sound design.',
 '<p>نحوّل لقطاتك الخام إلى فيديوهات مصقولة واحترافية جاهزة للنشر.</p><ul><li>المونتاج الاحترافي</li><li>Motion Graphics</li><li>تصحيح الألوان</li><li>هندسة الصوت</li></ul>',
 '<p>We turn your raw footage into polished, professional videos ready to publish.</p><ul><li>Professional editing</li><li>Motion graphics</li><li>Color correction</li><li>Sound design</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 6, true),

('social-media-automation', 'الرد الآلي على السوشيال ميديا', 'Social Media Automation', 'bot',
 'أتمتة الردود والرسائل على منصات التواصل مع توجيه الاستفسارات وجمع العملاء المحتملين.',
 'Automate replies and messages across social platforms with routing and lead collection.',
 '<p>نؤتمت التواصل مع عملائك على السوشيال ميديا لضمان استجابة سريعة على مدار الساعة.</p><ul><li>الردود التلقائية</li><li>الردود على الأسئلة الشائعة</li><li>جمع العملاء المحتملين</li><li>توجيه الرسائل</li></ul>',
 '<p>We automate your social media communication to ensure fast, around-the-clock responses.</p><ul><li>Auto replies</li><li>FAQ responses</li><li>Lead collection</li><li>Message routing</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 7, true),

('ai-social-assistant', 'الرد بالذكاء الاصطناعي', 'AI Social Media Assistant', 'zap',
 'مساعد ذكاء اصطناعي يرد على عملائك بذكاء بالعربية والإنجليزية ويؤهل العملاء المحتملين.',
 'An AI assistant that replies intelligently in Arabic and English and qualifies leads.',
 '<p>نوظف الذكاء الاصطناعي للرد على عملائك بشكل ذكي ومخصص يدعم العربية والإنجليزية.</p><ul><li>ردود ذكية على العملاء</li><li>أسئلة شائعة ذكية</li><li>تأهيل العملاء المحتملين</li><li>توجيه ذكي للمحادثات</li></ul>',
 '<p>We use AI to reply to your customers intelligently, with Arabic and English support.</p><ul><li>Intelligent customer replies</li><li>Smart FAQ</li><li>Lead qualification</li><li>Intelligent conversation routing</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 8, true),

('seo-content', 'محتوى SEO', 'SEO Content', 'search',
 'كتابة محتوى متوافق مع محركات البحث لتحسين الظهور وجذب الزيارات.',
 'Search-optimized content that improves visibility and attracts traffic.',
 '<p>نكتب محتوى متوافقًا مع محركات البحث يساعد موقعك على الظهور وجذب الزيارات المستهدفة.</p><ul><li>البحث عن الكلمات المفتاحية</li><li>مقالات متوافقة مع SEO</li><li>تحسين المحتوى الحالي</li><li>محتوى المدونات</li></ul>',
 '<p>We write search-optimized content that helps your site rank and attract targeted traffic.</p><ul><li>Keyword research</li><li>SEO-friendly articles</li><li>Content optimization</li><li>Blog content</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 9, false),

('digital-marketing-consulting', 'استشارات التسويق الرقمي', 'Digital Marketing Consulting', 'trending-up',
 'استشارات تسويقية متخصصة لبناء استراتيجية رقمية متكاملة تحقق أهدافك.',
 'Specialized marketing consulting to build a complete digital strategy that achieves your goals.',
 '<p>نساعدك على بناء استراتيجية تسويق رقمي متكاملة بناءً على تحليل السوق وأهدافك.</p><ul><li>تحليل السوق والمنافسين</li><li>تطوير الاستراتيجية الرقمية</li><li>خطط النمو</li><li>قياس الأداء والتحسين</li></ul>',
 '<p>We help you build a complete digital marketing strategy based on market analysis and your goals.</p><ul><li>Market and competitor analysis</li><li>Digital strategy development</li><li>Growth plans</li><li>Performance measurement</li></ul>',
 (select id from public.service_categories where slug='marketing'), 'published', 10, false)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  icon = excluded.icon,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  full_desc_ar = excluded.full_desc_ar,
  full_desc_en = excluded.full_desc_en,
  category_id = excluded.category_id,
  status = excluded.status,
  sort = excluded.sort,
  is_featured = excluded.is_featured;
