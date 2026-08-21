-- ============================================================================
-- Sitekoom — Page Header Backgrounds
-- Global default + per-page custom hero backgrounds (image/gif + overlay).
-- ============================================================================

create table if not exists public.page_hero_settings (
  id               uuid primary key default gen_random_uuid(),
  page_key         text not null unique, -- 'global', 'home', 'about', 'services', 'service', 'projects', 'project', 'blog', 'article', 'contact', 'request-project', 'privacy', 'terms'
  background_image text,
  background_gif   text,
  mobile_image     text,
  overlay_color    text not null default '#0b0a1a',
  overlay_opacity  numeric not null default 0.72,
  updated_at       timestamptz not null default now()
);

insert into public.page_hero_settings (page_key, background_image, background_gif, mobile_image, overlay_color, overlay_opacity)
values ('global', null, null, null, '#0b0a1a', 0.72)
on conflict (page_key) do nothing;

alter table public.page_hero_settings enable row level security;

drop policy if exists "page_hero_public_read" on public.page_hero_settings;
create policy "page_hero_public_read" on public.page_hero_settings
  for select to anon using (true);

drop policy if exists "page_hero_admin_all" on public.page_hero_settings;
create policy "page_hero_admin_all" on public.page_hero_settings
  for all to authenticated using (public.has_permission('homepage.view'))
  with check (public.has_permission('homepage.manage'));
