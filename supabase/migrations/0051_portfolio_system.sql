-- ============================================================================
-- Sitekoom — Dynamic Service-Based Portfolio System
-- Each service defines its own enabled portfolio field types; projects store
-- ordered portfolio items of those types. No per-service logic in code.
-- ============================================================================

-- Per-service portfolio configuration (array of enabled field-type keys).
alter table public.services
  add column if not exists portfolio_config jsonb not null default '[]'::jsonb;

-- Ordered, typed portfolio content items belonging to a project.
create table if not exists public.project_portfolio_items (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  service_id      uuid references public.services(id) on delete set null,
  type            text not null,           -- image | gallery | video | pdf | file | ... (see lib/portfolio.ts)
  title_ar        text,
  title_en        text,
  description_ar  text,
  description_en  text,
  caption_ar      text,
  caption_en      text,
  alt_ar          text,
  alt_en          text,
  url             text,
  thumbnail       text,
  platform        text,
  icon            text,
  button_text_ar  text,
  button_text_en  text,
  button_style    text,
  button_action   text,
  display_mode    text,
  is_visible      boolean not null default true,
  is_featured     boolean not null default false,
  sort            integer not null default 0,
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists ppi_project_idx on public.project_portfolio_items (project_id, sort);
create index if not exists ppi_service_idx on public.project_portfolio_items (service_id);

alter table public.project_portfolio_items enable row level security;
drop policy if exists "ppi_public_read" on public.project_portfolio_items;
create policy "ppi_public_read" on public.project_portfolio_items
  for select to anon using (is_visible = true);
drop policy if exists "ppi_admin_all" on public.project_portfolio_items;
create policy "ppi_admin_all" on public.project_portfolio_items
  for all to authenticated using (public.has_permission('projects.view'))
  with check (public.has_permission('projects.manage'));
