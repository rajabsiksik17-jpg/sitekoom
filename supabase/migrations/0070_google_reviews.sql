-- ============================================================================
-- Sitekoom — Google Reviews (cached reviews + homepage section)
-- ============================================================================
create table if not exists public.google_reviews (
  id           uuid primary key default gen_random_uuid(),
  author_name  text,
  author_photo text,
  rating       numeric not null default 5,
  text         text,
  review_date  text,
  review_url   text,
  sort         integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists google_reviews_active_idx on public.google_reviews (is_active, sort);

-- Public/private section settings (no secret here).
insert into public.site_settings (key, value, is_public) values
  ('google_reviews', '{"enabled":true,"count":6,"title_ar":"آراء عملائنا تصنع فرقنا","title_en":"Our Clients Are Our Best Work","description_ar":"عملاؤنا هم أهم أعمالنا، وتجاربهم هي أفضل شهادة على جودة ما نقدمه.","description_en":"Our clients are at the heart of everything we do. Discover what they say about their experience with Sitekoom.","maps_url":"","cache_hours":24,"rating":0,"total":0}'::jsonb, true)
on conflict (key) do nothing;

-- Permissions
insert into public.permissions (key, name_ar, name_en, group_key, sort) values
  ('reviews.view','عرض التقييمات','View Reviews','reviews',44),
  ('reviews.manage','إدارة التقييمات','Manage Reviews','reviews',45)
on conflict (key) do nothing;

alter table public.google_reviews enable row level security;

drop policy if exists "google_reviews_public_read" on public.google_reviews;
create policy "google_reviews_public_read" on public.google_reviews
  for select to anon using (is_active = true);

drop policy if exists "google_reviews_admin_all" on public.google_reviews;
create policy "google_reviews_admin_all" on public.google_reviews
  for all to authenticated
  using (public.has_permission('reviews.view'))
  with check (public.has_permission('reviews.manage'));
