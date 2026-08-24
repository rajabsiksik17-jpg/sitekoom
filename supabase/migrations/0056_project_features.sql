-- Project features (per-work highlights) — safe, additive.
create table if not exists public.project_features (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  icon           text,
  title_ar       text not null,
  title_en       text not null,
  description_ar text,
  description_en text,
  sort           integer not null default 0
);
create index if not exists project_features_project_idx on public.project_features (project_id, sort);

alter table public.project_features enable row level security;
drop policy if exists "project_features_public_read" on public.project_features;
create policy "project_features_public_read" on public.project_features
  for select to anon using (true);
drop policy if exists "project_features_admin_all" on public.project_features;
create policy "project_features_admin_all" on public.project_features
  for all to authenticated using (public.has_permission('projects.view'))
  with check (public.has_permission('projects.manage'));
