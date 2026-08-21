-- ============================================================================
-- Sitekoom — Content population (Company, Statistics, Hero, Sections, Settings)
-- ============================================================================

-- Remove broken updated_at triggers that were historically attached (via an
-- earlier version of 0001) to tables that have no `updated_at` column. This
-- makes this file safe to re-run on databases where those triggers exist.
do $$
declare t text;
begin
  foreach t in array array[
    'homepage_sliders','homepage_sections','marquee_messages',
    'team_members','statistics','social_links','media'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Company info (About page + Why Sitekoom)
-- ---------------------------------------------------------------------------
insert into public.company_info (id, about_ar, about_en, mission_ar, mission_en, vision_ar, vision_en, values_ar, values_en, why_ar, why_en)
values (
  1,
  $c$سايتكم شركة متخصصة في تطوير الحلول الرقمية للشركات والمؤسسات، نعمل على تصميم وتطوير المواقع والمتاجر الإلكترونية والتطبيقات والأنظمة المخصصة التي تساعد الأعمال على العمل بشكل أكثر كفاءة والوصول إلى عملائها بطريقة أفضل. نجمع بين التصميم، البرمجة وفهم احتياجات الأعمال لنقدم حلولًا رقمية عملية وقابلة للتوسع.$c$,
  $c$Sitekoom is a digital solutions company focused on helping businesses and organizations build modern digital experiences and technology platforms. We design and develop websites, e-commerce stores, mobile applications and custom business systems that help organizations operate more efficiently and connect with their customers. By combining design, technology and business understanding, we create practical digital solutions built for growth.$c$,
  $c$تمكين الشركات من النمو من خلال حلول رقمية عملية واحترافية تجمع بين التصميم والتقنية وفهم احتياجات الأعمال.$c$,
  $c$Empowering businesses to grow through practical, professional digital solutions that combine design, technology and business understanding.$c$,
  $c$أن نكون الشريك الرقمي الأول للشركات والمؤسسات في المنطقة.$c$,
  $c$To become the leading digital partner for businesses and organizations in the region.$c$,
  $c$["الاحترافية","الابتكار","الشفافية","الجودة","الالتزام","التركيز على النتائج"]$c$::jsonb,
  $c$["Professionalism","Innovation","Transparency","Quality","Commitment","Results-driven"]$c$::jsonb,
  $c$[{"icon":"puzzle","title":"حلول مصممة حول أعمالك","description":"نفهم احتياجاتك أولًا ثم نبني الحل المناسب لطبيعة عملك."},{"icon":"trending-up","title":"تقنية قابلة للتوسع","description":"نبني حلولًا يمكن تطويرها مع نمو أعمالك بدل الحاجة إلى إعادة البناء من الصفر."},{"icon":"sparkles","title":"تجربة مستخدم احترافية","description":"نركز على سهولة الاستخدام وسرعة الوصول إلى المعلومات وتحسين تجربة العميل."},{"icon":"shield-check","title":"أمان وأداء","description":"نهتم بأداء النظام وحماية البيانات وأفضل الممارسات التقنية."},{"icon":"heart-handshake","title":"دعم مستمر","description":"لا ينتهي دورنا عند إطلاق المشروع، بل نستمر في الدعم والصيانة والتطوير."},{"icon":"layers","title":"حلول متكاملة","description":"من الموقع والمتجر إلى التطبيقات والأنظمة الداخلية، نوفر حلولًا رقمية تحت مظلة واحدة."}]$c$::jsonb,
  $c$[{"icon":"puzzle","title":"Built Around Your Business","description":"We understand your requirements before designing the right digital solution."},{"icon":"trending-up","title":"Scalable Technology","description":"Our solutions are designed to evolve as your business grows."},{"icon":"sparkles","title":"Professional User Experience","description":"We focus on usability, performance and creating better customer experiences."},{"icon":"shield-check","title":"Performance & Security","description":"We follow modern development practices to deliver secure and reliable solutions."},{"icon":"heart-handshake","title":"Ongoing Support","description":"Our relationship doesn't end when your project goes live. We continue supporting and developing your solution."},{"icon":"layers","title":"Complete Digital Solutions","description":"From websites and e-commerce to mobile apps and business systems, we provide a complete digital technology partner."}]$c$::jsonb
)
on conflict (id) do update set
  about_ar = excluded.about_ar,
  about_en = excluded.about_en,
  mission_ar = excluded.mission_ar,
  mission_en = excluded.mission_en,
  vision_ar = excluded.vision_ar,
  vision_en = excluded.vision_en,
  values_ar = excluded.values_ar,
  values_en = excluded.values_en,
  why_ar = excluded.why_ar,
  why_en = excluded.why_en;

-- ---------------------------------------------------------------------------
-- Statistics
-- ---------------------------------------------------------------------------
insert into public.statistics (id, label_ar, label_en, value, suffix, icon, sort) values
  ('70000000-0000-0000-0000-000000000001','مشروعًا تم تنفيذه','Projects Delivered',120,'+','folder-check',1),
  ('70000000-0000-0000-0000-000000000002','عميلًا','Clients',80,'+','smile',2),
  ('70000000-0000-0000-0000-000000000003','سنوات من الخبرة','Years of Experience',4,'+','award',3),
  ('70000000-0000-0000-0000-000000000004','حلًا وخدمة رقمية','Digital Solutions & Services',15,'+','layers',4)
on conflict (id) do update set
  label_ar = excluded.label_ar,
  label_en = excluded.label_en,
  value = excluded.value,
  suffix = excluded.suffix;

-- ---------------------------------------------------------------------------
-- Hero Slider (Slide 1)
-- ---------------------------------------------------------------------------
update public.homepage_sliders
set
  title_ar = $c$نحوّل أفكارك إلى حلول رقمية تنمو مع أعمالك$c$,
  title_en = $c$We Turn Ideas Into Digital Solutions That Grow With Your Business$c$,
  subtitle_ar = $c$شريكك الرقمي الموثوق$c$,
  subtitle_en = $c$Your trusted digital partner$c$,
  description_ar = $c$من المواقع والمتاجر الإلكترونية إلى التطبيقات والأنظمة المخصصة، نصمم ونطور حلولًا رقمية تساعد الشركات على بناء حضور أقوى والعمل بكفاءة أكبر.$c$,
  description_en = $c$From websites and e-commerce stores to mobile applications and custom business systems, we build digital solutions that help businesses grow, operate smarter and connect with their customers.$c$,
  cta_text_ar = $c$ابدأ مشروعك$c$,
  cta_text_en = $c$Start Your Project$c$,
  cta_url = $c$/request-project$c$,
  cta2_text_ar = $c$استكشف خدماتنا$c$,
  cta2_text_en = $c$Explore Our Services$c$,
  cta2_url = $c$/services$c$
where id = '80000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- Marquee messages
-- ---------------------------------------------------------------------------
update public.marquee_messages
set text_ar = $c$نحوّل أفكارك إلى حلول رقمية تنمو مع أعمالك$c$,
    text_en = $c$We turn ideas into digital solutions that grow with your business$c$
where id = '90000000-0000-0000-0000-000000000001';

update public.marquee_messages
set text_ar = $c$مواقع • متاجر • تطبيقات • أنظمة مخصصة$c$,
    text_en = $c$Websites • E-Commerce • Apps • Custom Systems$c$
where id = '90000000-0000-0000-0000-000000000002';

update public.marquee_messages
set text_ar = $c$حلول رقمية متكاملة للشركات والمؤسسات$c$,
    text_en = $c$Complete digital solutions for businesses and enterprises$c$
where id = '90000000-0000-0000-0000-000000000003';

-- ---------------------------------------------------------------------------
-- Homepage sections
-- ---------------------------------------------------------------------------
insert into public.homepage_sections (key, title_ar, title_en, description_ar, description_en, is_active, sort) values
  ('services','حلول رقمية مصممة لأعمالك','Digital Solutions Built Around Your Business',
   'نقدم مجموعة متكاملة من الخدمات الرقمية لمساعدة الشركات على بناء حضورها الرقمي وتطوير عملياتها وتحقيق أهدافها.',
   'We provide a complete range of digital services designed to help businesses build their digital presence, improve operations and achieve their goals.', true, 3),
  ('statistics','أرقام نفخر بها','Our Numbers',
   'إنجازات تعكس ثقة عملائنا ونتائج أعمالنا.',
   'Achievements that reflect the trust of our clients and the results of our work.', true, 5),
  ('why','لماذا تختار سايتكم؟','Why Choose Sitekoom?',
   'لأننا لا نبني حلولًا رقمية لمجرد أن تكون موجودة، بل نبنيها لتخدم أهدافك وتساعد أعمالك على النمو.',
   'We don''t build digital solutions simply to put them online. We build them to support your goals, improve your operations and help your business grow.', true, 6),
  ('projects','أحدث أعمالنا','Our Latest Work',
   'نحوّل المتطلبات والأفكار إلى مشاريع رقمية حقيقية تجمع بين التصميم، التقنية والنتائج.',
   'We turn ideas and business requirements into real digital products that combine design, technology and results.', true, 7),
  ('cta','لديك فكرة لمشروعك القادم؟','Have an Idea for Your Next Project?',
   'أخبرنا عن فكرتك، وسنساعدك على تحويلها إلى حل رقمي عملي واحترافي قابل للنمو.',
   'Tell us about your idea and let our team help you turn it into a practical, professional and scalable digital solution.', true, 9)
on conflict (key) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en;

-- ---------------------------------------------------------------------------
-- Site settings (footer description / tagline)
-- ---------------------------------------------------------------------------
update public.site_settings
set value = value || $c${
  "tagline_ar": "سايتكم شركة متخصصة في تطوير الحلول الرقمية، من المواقع والمتاجر الإلكترونية إلى التطبيقات والأنظمة المخصصة وحلول الأعمال.",
  "tagline_en": "Sitekoom is a digital solutions company providing websites, e-commerce platforms, mobile applications, custom software and business management systems."
}$c$::jsonb
where key = 'general';
