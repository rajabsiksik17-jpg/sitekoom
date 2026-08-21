-- ============================================================================
-- Sitekoom — Enhancements
-- 1. Realtime fix: REPLICA IDENTITY FULL so UPDATE events (chat status) reach clients.
-- 2. Chat message status column.
-- 3. Contact request extra fields (country, reason, phone metadata).
-- 4. Project requests (separate lead type for quotes).
-- 5. Homepage slider header theme.
-- ============================================================================

-- Realtime UPDATE events require replica identity full to carry the new row.
alter table public.live_chat_conversations replica identity full;
alter table public.live_chat_messages replica identity full;

-- Chat message status
alter table public.live_chat_messages add column if not exists status text not null default 'sent';

-- Contact requests: reason, country, phone metadata
alter table public.contact_requests add column if not exists country text;
alter table public.contact_requests add column if not exists reason text;
alter table public.contact_requests add column if not exists phone_meta jsonb;

-- Homepage slider header theme
alter table public.homepage_sliders add column if not exists header_theme text not null default 'dark';

-- ============================================================================
-- Project Requests (Quotes)
-- ============================================================================

create table if not exists public.project_requests (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  country         text,
  company         text,
  service_id      uuid references public.services(id) on delete set null,
  service_name    text,
  other_service   text,
  project_details text,
  budget          text,
  other_budget    text,
  timeline        text,
  attachments     text[] not null default '{}',
  source          text,
  source_page     text,
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  device_type     text,
  ip_address      text,
  phone_meta      jsonb,
  status          text not null default 'new',
  priority        text not null default 'medium',
  assigned_to     uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists project_requests_status_idx on public.project_requests (status, created_at desc);
create index if not exists project_requests_service_idx on public.project_requests (service_id);
create index if not exists project_requests_assigned_idx on public.project_requests (assigned_to);

create table if not exists public.project_request_notes (
  id                 uuid primary key default gen_random_uuid(),
  project_request_id uuid not null references public.project_requests(id) on delete cascade,
  author_id          uuid references public.users(id) on delete set null,
  body               text not null,
  is_internal        boolean not null default true,
  created_at         timestamptz not null default now()
);
create index if not exists project_request_notes_idx on public.project_request_notes (project_request_id);

alter table public.project_request_notes enable row level security;
drop policy if exists "project_request_notes_admin_all" on public.project_request_notes;
create policy "project_request_notes_admin_all" on public.project_request_notes
  for all to authenticated using (public.has_permission('contacts.view'))
  with check (public.has_permission('contacts.manage'));

drop trigger if exists trg_project_requests_updated on public.project_requests;
create trigger trg_project_requests_updated before update on public.project_requests for each row execute procedure public.set_updated_at();

alter table public.project_requests enable row level security;

drop policy if exists "project_requests_public_insert" on public.project_requests;
create policy "project_requests_public_insert" on public.project_requests for insert to anon with check (true);

drop policy if exists "project_requests_admin_select" on public.project_requests;
create policy "project_requests_admin_select" on public.project_requests
  for select to authenticated using (public.has_permission('contacts.view'));
drop policy if exists "project_requests_admin_write" on public.project_requests;
create policy "project_requests_admin_write" on public.project_requests
  for update to authenticated using (public.has_permission('contacts.view'))
  with check (public.has_permission('contacts.manage'));
drop policy if exists "project_requests_admin_delete" on public.project_requests;
create policy "project_requests_admin_delete" on public.project_requests
  for delete to authenticated using (public.has_permission('contacts.manage'));

-- Realtime for admin dashboards
do $$
begin
  alter publication supabase_realtime add table public.project_requests;
exception when others then null;
end $$;

-- Pricing request statuses (dashboard-driven)
insert into public.site_settings (key, value, is_public) values
  ('pricing_statuses', '["new","reviewing","contacted","quotation_sent","negotiation","won","lost","closed"]'::jsonb, true)
on conflict (key) do nothing;
