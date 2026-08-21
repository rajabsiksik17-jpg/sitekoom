-- ============================================================================
-- Sitekoom — Dynamic pages (privacy, terms + custom CMS pages)
-- ============================================================================

create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title_ar   text not null,
  title_en   text not null,
  content_ar text,
  content_en text,
  status     text not null default 'published',  -- published | draft
  is_system  boolean not null default false,
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pages_slug_idx on public.pages (slug);

drop trigger if exists trg_pages_updated on public.pages;
create trigger trg_pages_updated before update on public.pages for each row execute procedure public.set_updated_at();

alter table public.pages enable row level security;

drop policy if exists "pages_public_read" on public.pages;
create policy "pages_public_read" on public.pages
  for select to anon using (status = 'published');

drop policy if exists "pages_admin_all" on public.pages;
create policy "pages_admin_all" on public.pages
  for all to authenticated using (public.has_permission('articles.view'))
  with check (public.has_permission('articles.manage'));

-- Seed system pages
insert into public.pages (slug, title_ar, title_en, content_ar, content_en, status, is_system, sort) values
  ('privacy', 'سياسة الخصوصية', 'Privacy Policy',
   $c$<h2>سياسة الخصوصية</h2><p>نحن في سايتكم نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات التي تقدمها لنا.</p><p>نقوم بجمع المعلومات التي تقدمها طوعًا عند التواصل معنا أو استخدام خدماتنا، مثل الاسم والبريد الإلكتروني ورقم الهاتف. نستخدم هذه المعلومات للرد على استفساراتك وتقديم خدماتنا.</p><p>لا نشارك بياناتك مع أي طرف ثالث إلا بما يقتضيه تقديم الخدمة أو بموجب القانون.</p>$c$,
   $c$<h2>Privacy Policy</h2><p>At Sitekoom we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use and protect the information you provide.</p><p>We collect information you voluntarily provide when contacting us or using our services, such as name, email and phone. We use this information to respond to your inquiries and deliver our services.</p><p>We do not share your data with any third party except as required to provide the service or by law.</p>$c$,
   'published', true, 1),
  ('terms', 'الشروط والأحكام', 'Terms & Conditions',
   $c$<h2>الشروط والأحكام</h2><p>باستخدامك موقع وخدمات سايتكم، فإنك توافق على الشروط والأحكام التالية.</p><p>جميع محتويات الموقع ملك لسايتكم ولا يجوز استخدامها دون إذن. نقدم خدماتنا بمهنية عالية ونلتزم بالجداول الزمنية المتفق عليها.</p><p>تخضع هذه الشروط لقوانين المملكة الأردنية الهاشمية.</p>$c$,
   $c$<h2>Terms &amp; Conditions</h2><p>By using the Sitekoom website and services, you agree to the following terms and conditions.</p><p>All content on the site is owned by Sitekoom and may not be used without permission. We provide our services with high professionalism and adhere to agreed timelines.</p><p>These terms are governed by the laws of the Hashemite Kingdom of Jordan.</p>$c$,
   'published', true, 2)
on conflict (slug) do nothing;
