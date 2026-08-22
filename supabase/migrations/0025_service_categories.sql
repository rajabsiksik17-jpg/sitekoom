-- ============================================================================
-- Sitekoom — Service categories (dynamic, expandable)
--   Categories -> Services -> Projects
-- ============================================================================

create table if not exists public.service_categories (
  id                  uuid primary key default gen_random_uuid(),
  name_ar             text not null,
  name_en             text not null,
  slug                text not null unique,
  description_ar      text,
  description_en      text,
  icon                text,
  image               text,
  seo_title_ar        text,
  seo_title_en        text,
  meta_description_ar text,
  meta_description_en text,
  og_image            text,
  sort                integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists service_categories_active_idx on public.service_categories (is_active, sort);

-- Link services to a main category (no category name duplicated in services).
alter table public.services
  add column if not exists category_id uuid references public.service_categories(id) on delete set null;
create index if not exists services_category_idx on public.services (category_id);

-- Seed the two main categories.
insert into public.service_categories (slug, name_ar, name_en, icon, description_ar, description_en, sort, is_active) values
  ('programming', 'البرمجة وأنظمة المعلومات', 'Software & Information Systems',
   'code',
   'تطوير المواقع والمتاجر والتطبيقات والأنظمة الإدارية المخصصة بأحدث التقنيات.',
   'Websites, e-commerce, mobile apps and custom business systems built with modern technology.',
   1, true),
  ('marketing', 'التسويق والإعلام الرقمي', 'Digital Marketing & Media',
   'megaphone',
   'إدارة السوشيال ميديا وصناعة المحتوى والإعلانات والتصوير والفيديو لبناء حضورك الرقمي.',
   'Social media, content, advertising, photography and video that build your digital presence.',
   2, true)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  icon = excluded.icon,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  sort = excluded.sort,
  is_active = excluded.is_active;

-- Assign all existing programming services to the "programming" category.
update public.services
set category_id = (select id from public.service_categories where slug = 'programming')
where category_id is null and slug in (
  'web-development', 'ecommerce', 'custom-software', 'mobile-apps',
  'erp-systems', 'pos-systems', 'crm-systems', 'administrative-systems'
);

-- RLS (admin-only write; public read for active categories).
alter table public.service_categories enable row level security;
drop policy if exists "service_categories_public_read" on public.service_categories;
create policy "service_categories_public_read" on public.service_categories
  for select to anon using (is_active = true);
drop policy if exists "service_categories_admin_all" on public.service_categories;
create policy "service_categories_admin_all" on public.service_categories
  for all to authenticated using (public.has_permission('services.view'))
  with check (public.has_permission('services.manage'));
