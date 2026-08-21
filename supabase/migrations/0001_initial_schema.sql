-- ============================================================================
-- Sitekoom Corporate Digital Platform — Initial Schema
-- Supabase / PostgreSQL
-- ----------------------------------------------------------------------------
-- Run this migration in the Supabase SQL editor, or via:
--   supabase db push
--   supabase migration up
--
-- This file is idempotent (safe to re-run) and can be executed from a fresh
-- Supabase database start-to-finish without errors.
--
-- Dependency order: enums → helper function → roles → permissions →
--   role_permissions → users → user_permissions → ... → RLS policies.
-- Every table is created before any Foreign Key / Function / Trigger /
-- RLS Policy that references it.
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (idempotent)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regtype('public.user_status') is null then
    execute 'create type public.user_status as enum (''active'', ''disabled'')';
  end if;
end $$;

do $$
begin
  if to_regtype('public.publish_status') is null then
    execute 'create type public.publish_status as enum (''draft'', ''published'', ''archived'')';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- 1. Roles, permissions, users (RBAC)
--    Order matters: users references roles, user_permissions references users.
-- ===========================================================================

create table if not exists public.roles (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  name_ar       text not null,
  name_en       text not null,
  description   text,
  is_super      boolean not null default false,
  is_system     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name_ar     text not null,
  name_en     text not null,
  group_key   text not null default 'general',
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id        uuid not null references public.roles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

-- Profile table linked to Supabase Auth (auth.users).
-- This is the public-facing profile for every auth user; RBAC role lives here.
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique,
  name          text not null default '',
  avatar_url    text,
  phone         text,
  position_ar   text,
  position_en   text,
  role_id       uuid references public.roles(id) on delete set null,
  status        public.user_status not null default 'active',
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Per-user permission overrides (for "Partial Admin").
-- Must come AFTER public.users (references public.users(id)).
create table if not exists public.user_permissions (
  user_id        uuid not null references public.users(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  allowed        boolean not null default true,
  primary key (user_id, permission_key)
);

-- Auto-provision a public.users row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RBAC helper functions (SECURITY DEFINER so RLS can use them)
-- ---------------------------------------------------------------------------
create or replace function public.current_role_key()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.key
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid()
    and u.status = 'active'
    and u.deleted_at is null
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select r.is_super
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = auth.uid() and u.status = 'active' and u.deleted_at is null
    limit 1
  ), false);
$$;

create or replace function public.has_permission(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Super admin bypasses the permission matrix.
    public.is_super_admin()
    or exists (
      select 1 from public.user_permissions up
      where up.user_id = auth.uid() and up.permission_key = p_key and up.allowed = true
    )
    or exists (
      select 1
      from public.users u
      join public.role_permissions rp on rp.role_id = u.role_id
      where u.id = auth.uid()
        and u.status = 'active' and u.deleted_at is null
        and rp.permission_key = p_key
    );
$$;

-- List agents (users with chat.manage) for live-chat transfer.
-- SECURITY DEFINER so Communication Managers can transfer without users.view.
create or replace function public.list_agents()
returns table (id uuid, name text, avatar_url text, position_ar text, position_en text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.name, u.avatar_url, u.position_ar, u.position_en
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.status = 'active' and u.deleted_at is null
    and (r.is_super or exists (
      select 1 from public.role_permissions rp
      where rp.role_id = r.id and rp.permission_key = 'chat.manage'
    ))
  order by u.name;
$$;

-- ===========================================================================
-- 2. Services
-- ===========================================================================

create table if not exists public.services (
  id                 uuid primary key default gen_random_uuid(),
  title_ar           text not null,
  title_en           text not null,
  slug               text not null unique,
  icon               text,
  short_desc_ar      text,
  short_desc_en      text,
  full_desc_ar       text,
  full_desc_en       text,
  main_image         text,
  status             public.publish_status not null default 'published',
  sort               integer not null default 0,
  is_featured        boolean not null default false,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create index if not exists services_slug_idx on public.services (slug);
create index if not exists services_status_idx on public.services (status, sort);

create table if not exists public.service_images (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services(id) on delete cascade,
  url         text not null,
  alt         text,
  is_primary  boolean not null default false,
  sort        integer not null default 0
);
create index if not exists service_images_service_idx on public.service_images (service_id);

create table if not exists public.service_features (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references public.services(id) on delete cascade,
  kind          text not null default 'feature', -- feature | benefit | process | technology
  icon          text,
  title_ar      text not null,
  title_en      text not null,
  description_ar text,
  description_en text,
  sort          integer not null default 0
);
create index if not exists service_features_service_idx on public.service_features (service_id, kind);

create table if not exists public.service_faqs (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services(id) on delete cascade,
  question_ar text not null,
  question_en text not null,
  answer_ar   text not null,
  answer_en   text not null,
  sort        integer not null default 0
);
create index if not exists service_faqs_service_idx on public.service_faqs (service_id);

-- ===========================================================================
-- 3. Projects
-- ===========================================================================

create table if not exists public.project_categories (
  id        uuid primary key default gen_random_uuid(),
  name_ar   text not null,
  name_en   text not null,
  slug      text not null unique,
  sort      integer not null default 0
);

create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  title_ar       text not null,
  title_en       text not null,
  slug           text not null unique,
  short_desc_ar  text,
  short_desc_en  text,
  full_desc_ar   text,
  full_desc_en   text,
  service_id     uuid references public.services(id) on delete set null,
  category_id    uuid references public.project_categories(id) on delete set null,
  status         text not null default 'completed', -- in_progress | preparing | ready | maintenance | completed | paused
  completion_date date,
  thumbnail      text,
  cover_image    text,
  project_url    text,
  technologies   text[] not null default '{}',
  status_field   public.publish_status not null default 'published', -- draft/published/archived
  sort           integer not null default 0,
  is_featured    boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists projects_slug_idx on public.projects (slug);
create index if not exists projects_status_idx on public.projects (status_field, sort);
create index if not exists projects_service_idx on public.projects (service_id);
create index if not exists projects_category_idx on public.projects (category_id);

create table if not exists public.project_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  url         text not null,
  alt         text,
  is_primary  boolean not null default false,
  sort        integer not null default 0
);
create index if not exists project_images_project_idx on public.project_images (project_id);

-- ===========================================================================
-- 4. Homepage slider + sections + marquee
-- ===========================================================================

create table if not exists public.homepage_sliders (
  id             uuid primary key default gen_random_uuid(),
  desktop_image  text,
  tablet_image   text,
  mobile_image   text,
  title_ar       text not null default '',
  title_en       text not null default '',
  subtitle_ar    text,
  subtitle_en    text,
  description_ar text,
  description_en text,
  cta_text_ar    text,
  cta_text_en    text,
  cta_url        text,
  cta2_text_ar   text,
  cta2_text_en   text,
  cta2_url       text,
  animation      text default 'fade-up',
  is_active      boolean not null default true,
  sort           integer not null default 0
);
create index if not exists homepage_sliders_active_idx on public.homepage_sliders (is_active, sort);

create table if not exists public.homepage_sections (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique, -- hero | marquee | services | intro | statistics | why | projects | team | cta | contact
  title_ar      text,
  title_en      text,
  description_ar text,
  description_en text,
  is_active     boolean not null default true,
  sort          integer not null default 0,
  data          jsonb not null default '{}'::jsonb
);

create table if not exists public.marquee_messages (
  id          uuid primary key default gen_random_uuid(),
  text_ar     text not null,
  text_en     text not null,
  is_active   boolean not null default true,
  sort        integer not null default 0
);

-- ===========================================================================
-- 5. Company info / about / team / statistics / gallery
-- ===========================================================================

create table if not exists public.company_info (
  id            integer primary key default 1 check (id = 1),
  about_ar      text,
  about_en      text,
  mission_ar    text,
  mission_en    text,
  vision_ar     text,
  vision_en     text,
  values_ar     jsonb not null default '[]'::jsonb,
  values_en     jsonb not null default '[]'::jsonb,
  why_ar        jsonb not null default '[]'::jsonb,
  why_en        jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

create table if not exists public.company_images (
  id        uuid primary key default gen_random_uuid(),
  url       text not null,
  alt       text,
  caption   text,
  sort      integer not null default 0
);

create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  name_ar      text not null,
  name_en      text not null,
  position_ar  text,
  position_en  text,
  bio_ar       text,
  bio_en       text,
  photo        text,
  email        text,
  social_links jsonb not null default '{}'::jsonb,
  is_active    boolean not null default true,
  sort         integer not null default 0
);

create table if not exists public.statistics (
  id       uuid primary key default gen_random_uuid(),
  label_ar text not null,
  label_en text not null,
  value    numeric not null default 0,
  suffix   text,
  icon     text,
  sort     integer not null default 0
);

-- ===========================================================================
-- 6. Social links
-- ===========================================================================

create table if not exists public.social_links (
  id        uuid primary key default gen_random_uuid(),
  platform  text not null,
  label     text,
  url       text not null,
  icon      text,
  is_active boolean not null default true,
  sort      integer not null default 0
);

-- ===========================================================================
-- 7. Contact requests (Leads / mini-CRM)
-- ===========================================================================

create table if not exists public.contact_requests (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  company         text,
  service_id      uuid references public.services(id) on delete set null,
  service_name    text,
  subject         text,
  message         text,
  budget          text,
  source          text,           -- service | contact | project | article | home | other
  source_page     text,           -- the URL/path the request came from
  source_ref_id   uuid,           -- project/article id when applicable
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  device_type     text,
  ip_address      text,
  status          text not null default 'new',      -- new | contacted | in_progress | converted | closed | spam
  priority        text not null default 'medium',   -- low | medium | high | urgent
  assigned_to     uuid references public.users(id) on delete set null,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists contact_requests_status_idx on public.contact_requests (status, created_at desc);
create index if not exists contact_requests_service_idx on public.contact_requests (service_id);
create index if not exists contact_requests_assigned_idx on public.contact_requests (assigned_to);

create table if not exists public.contact_notes (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contact_requests(id) on delete cascade,
  author_id   uuid references public.users(id) on delete set null,
  body        text not null,
  is_internal boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists contact_notes_contact_idx on public.contact_notes (contact_id);

-- ===========================================================================
-- 8. Articles / Blog
-- ===========================================================================

create table if not exists public.article_categories (
  id        uuid primary key default gen_random_uuid(),
  name_ar   text not null,
  name_en   text not null,
  slug      text not null unique,
  sort      integer not null default 0
);

create table if not exists public.article_tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  slug  text not null unique
);

create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  title_ar      text not null,
  title_en      text not null,
  slug          text not null unique,
  excerpt_ar    text,
  excerpt_en    text,
  content_ar    text,          -- rich HTML
  content_en    text,          -- rich HTML
  cover_image   text,
  author_id     uuid references public.users(id) on delete set null,
  category_id   uuid references public.article_categories(id) on delete set null,
  status        public.publish_status not null default 'draft',
  scheduled_for timestamptz,
  published_at  timestamptz,
  is_featured   boolean not null default false,
  related_service_ids  uuid[] not null default '{}',
  related_project_ids  uuid[] not null default '{}',
  related_article_ids  uuid[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists articles_slug_idx on public.articles (slug);
create index if not exists articles_status_idx on public.articles (status, published_at desc);
create index if not exists articles_category_idx on public.articles (category_id);

create table if not exists public.article_tag_relations (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id     uuid not null references public.article_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ===========================================================================
-- 9. SEO metadata (per entity + per locale)
-- ===========================================================================

create table if not exists public.seo_metadata (
  id               uuid primary key default gen_random_uuid(),
  entity_type      text not null,      -- page | home | about | service | project | article | contact | blog
  entity_id        uuid,
  locale           text not null default 'ar',
  seo_title        text,
  meta_description text,
  focus_keyword    text,
  keywords         text[] not null default '{}',
  canonical_url    text,
  og_title         text,
  og_description   text,
  og_image         text,
  twitter_card     text default 'summary_large_image',
  robots           text,
  schema           jsonb not null default '{}'::jsonb,
  unique (entity_type, entity_id, locale)
);
create index if not exists seo_metadata_entity_idx on public.seo_metadata (entity_type, entity_id);

-- ===========================================================================
-- 10. Live Chat
-- ===========================================================================

create table if not exists public.live_chat_conversations (
  id              uuid primary key default gen_random_uuid(),
  visitor_token   uuid not null default gen_random_uuid(), -- unguessable public token
  visitor_name    text,
  visitor_email   text,
  visitor_phone   text,
  first_message   text,
  status          text not null default 'waiting',  -- waiting | active | closed
  assigned_to     uuid references public.users(id) on delete set null,
  agent_name      text,
  agent_avatar    text,
  agent_position  text,
  source_page     text,
  referrer        text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  closed_at       timestamptz
);
create index if not exists chat_conversations_status_idx on public.live_chat_conversations (status, created_at desc);
create index if not exists chat_conversations_assigned_idx on public.live_chat_conversations (assigned_to);

create table if not exists public.live_chat_participants (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.live_chat_conversations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  is_agent        boolean not null default false,
  joined_at       timestamptz not null default now(),
  left_at         timestamptz
);
create index if not exists chat_participants_conv_idx on public.live_chat_participants (conversation_id);

create table if not exists public.live_chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.live_chat_conversations(id) on delete cascade,
  sender_type     text not null default 'visitor',  -- visitor | agent | system
  sender_id       uuid,                              -- users.id when agent
  body            text not null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);
create index if not exists chat_messages_conv_idx on public.live_chat_messages (conversation_id, created_at);

-- ===========================================================================
-- 11. Notifications
-- ===========================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade, -- null = broadcast to all admins
  type       text not null default 'info',  -- contact | chat | article | system | lead
  title_ar   text not null,
  title_en   text not null,
  body_ar    text,
  body_en    text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ===========================================================================
-- 12. Settings / Media / Analytics / Audit
-- ===========================================================================

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  name        text,
  mime_type   text,
  size        bigint,
  width       integer,
  height      integer,
  alt         text,
  folder      text default 'general',
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists media_created_idx on public.media (created_at desc);

create table if not exists public.analytics_events (
  id           uuid primary key default gen_random_uuid(),
  event_type   text not null,        -- page_view | service_view | project_view | article_view | contact_form_submitted | whatsapp_clicked | phone_clicked | live_chat_started | project_link_clicked ...
  entity_type  text,
  entity_id    uuid,
  page_path    text,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  device_type  text,
  session_id   text,
  created_at   timestamptz not null default now()
);
create index if not exists analytics_events_type_idx on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_events_entity_idx on public.analytics_events (entity_type, entity_id);

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  actor_name  text,
  action      text not null,      -- create | update | delete | publish | login | export | ...
  entity_type text,
  entity_id   text,
  description text,
  ip_address  text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

-- ===========================================================================
-- updated_at triggers
-- ===========================================================================
do $$
declare t text;
begin
  -- Only tables that have an `updated_at` column get the auto-update trigger.
  foreach t in array array[
    'roles','users','services','projects','contact_requests','articles',
    'company_info','live_chat_conversations','site_settings'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute procedure public.set_updated_at()', t, t);
  end loop;
end $$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.roles              enable row level security;
alter table public.permissions        enable row level security;
alter table public.role_permissions   enable row level security;
alter table public.user_permissions   enable row level security;
alter table public.users              enable row level security;

alter table public.services           enable row level security;
alter table public.service_images     enable row level security;
alter table public.service_features   enable row level security;
alter table public.service_faqs       enable row level security;

alter table public.project_categories enable row level security;
alter table public.projects           enable row level security;
alter table public.project_images     enable row level security;

alter table public.homepage_sliders   enable row level security;
alter table public.homepage_sections  enable row level security;
alter table public.marquee_messages   enable row level security;

alter table public.company_info       enable row level security;
alter table public.company_images     enable row level security;
alter table public.team_members       enable row level security;
alter table public.statistics         enable row level security;

alter table public.social_links       enable row level security;

alter table public.contact_requests   enable row level security;
alter table public.contact_notes      enable row level security;

alter table public.article_categories enable row level security;
alter table public.article_tags       enable row level security;
alter table public.articles           enable row level security;
alter table public.article_tag_relations enable row level security;

alter table public.seo_metadata       enable row level security;

alter table public.live_chat_conversations enable row level security;
alter table public.live_chat_participants  enable row level security;
alter table public.live_chat_messages      enable row level security;

alter table public.notifications      enable row level security;
alter table public.site_settings      enable row level security;
alter table public.media              enable row level security;
alter table public.analytics_events   enable row level security;
alter table public.audit_logs         enable row level security;

-- ---------------------------------------------------------------------------
-- PUBLIC (anon) read policies — published content only
-- ---------------------------------------------------------------------------

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select to anon using (status = 'published' and deleted_at is null);
drop policy if exists "service_images_public_read" on public.service_images;
create policy "service_images_public_read" on public.service_images for select to anon using (true);
drop policy if exists "service_features_public_read" on public.service_features;
create policy "service_features_public_read" on public.service_features for select to anon using (true);
drop policy if exists "service_faqs_public_read" on public.service_faqs;
create policy "service_faqs_public_read" on public.service_faqs for select to anon using (true);

drop policy if exists "project_categories_public_read" on public.project_categories;
create policy "project_categories_public_read" on public.project_categories for select to anon using (true);
drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read" on public.projects
  for select to anon using (status_field = 'published' and deleted_at is null);
drop policy if exists "project_images_public_read" on public.project_images;
create policy "project_images_public_read" on public.project_images for select to anon using (true);

drop policy if exists "sliders_public_read" on public.homepage_sliders;
create policy "sliders_public_read" on public.homepage_sliders
  for select to anon using (is_active = true);
drop policy if exists "sections_public_read" on public.homepage_sections;
create policy "sections_public_read" on public.homepage_sections for select to anon using (true);
drop policy if exists "marquee_public_read" on public.marquee_messages;
create policy "marquee_public_read" on public.marquee_messages
  for select to anon using (is_active = true);

drop policy if exists "company_info_public_read" on public.company_info;
create policy "company_info_public_read" on public.company_info for select to anon using (true);
drop policy if exists "company_images_public_read" on public.company_images;
create policy "company_images_public_read" on public.company_images for select to anon using (true);
drop policy if exists "team_public_read" on public.team_members;
create policy "team_public_read" on public.team_members for select to anon using (is_active = true);
drop policy if exists "statistics_public_read" on public.statistics;
create policy "statistics_public_read" on public.statistics for select to anon using (true);

drop policy if exists "social_links_public_read" on public.social_links;
create policy "social_links_public_read" on public.social_links for select to anon using (is_active = true);

drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read" on public.articles for select to anon
  using (status = 'published' and deleted_at is null and (published_at is null or published_at <= now()));
drop policy if exists "article_categories_public_read" on public.article_categories;
create policy "article_categories_public_read" on public.article_categories for select to anon using (true);
drop policy if exists "article_tags_public_read" on public.article_tags;
create policy "article_tags_public_read" on public.article_tags for select to anon using (true);
drop policy if exists "article_tag_relations_public_read" on public.article_tag_relations;
create policy "article_tag_relations_public_read" on public.article_tag_relations for select to anon using (true);

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings
  for select to anon using (is_public = true);

-- Public inserts
drop policy if exists "contact_requests_public_insert" on public.contact_requests;
create policy "contact_requests_public_insert" on public.contact_requests for insert to anon with check (true);
drop policy if exists "analytics_events_public_insert" on public.analytics_events;
create policy "analytics_events_public_insert" on public.analytics_events for insert to anon with check (true);

-- Live chat (anonymous visitors): unguessable UUID identifies the conversation.
-- Realtime requires SELECT for anon to stream; access is scoped by app via conversation id.
drop policy if exists "chat_conversations_public_insert" on public.live_chat_conversations;
create policy "chat_conversations_public_insert" on public.live_chat_conversations for insert to anon with check (true);
drop policy if exists "chat_conversations_public_read" on public.live_chat_conversations;
create policy "chat_conversations_public_read" on public.live_chat_conversations for select to anon using (true);
drop policy if exists "chat_participants_public_insert" on public.live_chat_participants;
create policy "chat_participants_public_insert" on public.live_chat_participants for insert to anon with check (true);
drop policy if exists "chat_participants_public_read" on public.live_chat_participants;
create policy "chat_participants_public_read" on public.live_chat_participants for select to anon using (true);
drop policy if exists "chat_messages_public_insert" on public.live_chat_messages;
create policy "chat_messages_public_insert" on public.live_chat_messages for insert to anon with check (true);
drop policy if exists "chat_messages_public_read" on public.live_chat_messages;
create policy "chat_messages_public_read" on public.live_chat_messages for select to anon using (true);

-- ---------------------------------------------------------------------------
-- AUTHENTICATED (admin) policies — guarded by has_permission()
-- ---------------------------------------------------------------------------

-- services
drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all" on public.services
  for all to authenticated using (public.has_permission('services.view'))
  with check (public.has_permission('services.manage'));
drop policy if exists "service_images_admin_all" on public.service_images;
create policy "service_images_admin_all" on public.service_images
  for all to authenticated using (public.has_permission('services.view'))
  with check (public.has_permission('services.manage'));
drop policy if exists "service_features_admin_all" on public.service_features;
create policy "service_features_admin_all" on public.service_features
  for all to authenticated using (public.has_permission('services.view'))
  with check (public.has_permission('services.manage'));
drop policy if exists "service_faqs_admin_all" on public.service_faqs;
create policy "service_faqs_admin_all" on public.service_faqs
  for all to authenticated using (public.has_permission('services.view'))
  with check (public.has_permission('services.manage'));

-- projects
drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
  for all to authenticated using (public.has_permission('projects.view'))
  with check (public.has_permission('projects.manage'));
drop policy if exists "project_images_admin_all" on public.project_images;
create policy "project_images_admin_all" on public.project_images
  for all to authenticated using (public.has_permission('projects.view'))
  with check (public.has_permission('projects.manage'));
drop policy if exists "project_categories_admin_all" on public.project_categories;
create policy "project_categories_admin_all" on public.project_categories
  for all to authenticated using (public.has_permission('projects.view'))
  with check (public.has_permission('projects.manage'));

-- homepage
drop policy if exists "sliders_admin_all" on public.homepage_sliders;
create policy "sliders_admin_all" on public.homepage_sliders
  for all to authenticated using (public.has_permission('homepage.view'))
  with check (public.has_permission('homepage.manage'));
drop policy if exists "sections_admin_all" on public.homepage_sections;
create policy "sections_admin_all" on public.homepage_sections
  for all to authenticated using (public.has_permission('homepage.view'))
  with check (public.has_permission('homepage.manage'));
drop policy if exists "marquee_admin_all" on public.marquee_messages;
create policy "marquee_admin_all" on public.marquee_messages
  for all to authenticated using (public.has_permission('homepage.view'))
  with check (public.has_permission('homepage.manage'));

-- company
drop policy if exists "company_admin_all" on public.company_info;
create policy "company_admin_all" on public.company_info
  for all to authenticated using (public.has_permission('company.view'))
  with check (public.has_permission('company.manage'));
drop policy if exists "company_images_admin_all" on public.company_images;
create policy "company_images_admin_all" on public.company_images
  for all to authenticated using (public.has_permission('company.view'))
  with check (public.has_permission('company.manage'));
drop policy if exists "team_admin_all" on public.team_members;
create policy "team_admin_all" on public.team_members
  for all to authenticated using (public.has_permission('company.view'))
  with check (public.has_permission('company.manage'));
drop policy if exists "statistics_admin_all" on public.statistics;
create policy "statistics_admin_all" on public.statistics
  for all to authenticated using (public.has_permission('company.view'))
  with check (public.has_permission('company.manage'));

-- social
drop policy if exists "social_admin_all" on public.social_links;
create policy "social_admin_all" on public.social_links
  for all to authenticated using (public.has_permission('social.view'))
  with check (public.has_permission('social.manage'));

-- contacts / leads
drop policy if exists "contacts_admin_select" on public.contact_requests;
create policy "contacts_admin_select" on public.contact_requests
  for select to authenticated using (public.has_permission('contacts.view'));
drop policy if exists "contacts_admin_write" on public.contact_requests;
create policy "contacts_admin_write" on public.contact_requests
  for update to authenticated using (public.has_permission('contacts.view'))
  with check (public.has_permission('contacts.manage'));
drop policy if exists "contacts_admin_delete" on public.contact_requests;
create policy "contacts_admin_delete" on public.contact_requests
  for delete to authenticated using (public.has_permission('contacts.manage'));
drop policy if exists "contact_notes_admin_all" on public.contact_notes;
create policy "contact_notes_admin_all" on public.contact_notes
  for all to authenticated using (public.has_permission('contacts.view'))
  with check (public.has_permission('contacts.manage'));

-- articles
drop policy if exists "articles_admin_all" on public.articles;
create policy "articles_admin_all" on public.articles
  for all to authenticated using (public.has_permission('articles.view'))
  with check (public.has_permission('articles.manage'));
drop policy if exists "article_categories_admin_all" on public.article_categories;
create policy "article_categories_admin_all" on public.article_categories
  for all to authenticated using (public.has_permission('articles.view'))
  with check (public.has_permission('articles.manage'));
drop policy if exists "article_tags_admin_all" on public.article_tags;
create policy "article_tags_admin_all" on public.article_tags
  for all to authenticated using (public.has_permission('articles.view'))
  with check (public.has_permission('articles.manage'));
drop policy if exists "article_tag_relations_admin_all" on public.article_tag_relations;
create policy "article_tag_relations_admin_all" on public.article_tag_relations
  for all to authenticated using (public.has_permission('articles.view'))
  with check (public.has_permission('articles.manage'));

-- seo
drop policy if exists "seo_admin_all" on public.seo_metadata;
create policy "seo_admin_all" on public.seo_metadata
  for all to authenticated using (public.has_permission('seo.view'))
  with check (public.has_permission('seo.manage'));

-- chat
drop policy if exists "chat_admin_all" on public.live_chat_conversations;
create policy "chat_admin_all" on public.live_chat_conversations
  for all to authenticated using (public.has_permission('chat.view'))
  with check (public.has_permission('chat.manage'));
drop policy if exists "chat_participants_admin_all" on public.live_chat_participants;
create policy "chat_participants_admin_all" on public.live_chat_participants
  for all to authenticated using (public.has_permission('chat.view'))
  with check (public.has_permission('chat.manage'));
drop policy if exists "chat_messages_admin_all" on public.live_chat_messages;
create policy "chat_messages_admin_all" on public.live_chat_messages
  for all to authenticated using (public.has_permission('chat.view'))
  with check (public.has_permission('chat.manage'));

-- notifications (admins read their own / broadcast)
drop policy if exists "notifications_admin_read" on public.notifications;
create policy "notifications_admin_read" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or (user_id is null and public.has_permission('notifications.view')));
drop policy if exists "notifications_admin_write" on public.notifications;
create policy "notifications_admin_write" on public.notifications
  for all to authenticated using (public.has_permission('notifications.view'))
  with check (public.has_permission('notifications.view'));

-- settings
drop policy if exists "settings_admin_all" on public.site_settings;
create policy "settings_admin_all" on public.site_settings
  for all to authenticated using (public.has_permission('settings.view'))
  with check (public.has_permission('settings.manage'));

-- media
drop policy if exists "media_admin_all" on public.media;
create policy "media_admin_all" on public.media
  for all to authenticated using (public.has_permission('media.view'))
  with check (public.has_permission('media.manage'));

-- analytics
drop policy if exists "analytics_admin_read" on public.analytics_events;
create policy "analytics_admin_read" on public.analytics_events
  for select to authenticated using (public.has_permission('analytics.view'));

-- audit
drop policy if exists "audit_admin_read" on public.audit_logs;
create policy "audit_admin_read" on public.audit_logs
  for select to authenticated using (public.has_permission('audit.view'));
drop policy if exists "audit_admin_insert" on public.audit_logs;
create policy "audit_admin_insert" on public.audit_logs
  for insert to authenticated with check (true);

-- users / roles (managed only by super admin or users.manage)
drop policy if exists "users_admin_read" on public.users;
create policy "users_admin_read" on public.users
  for select to authenticated using (public.has_permission('users.view') or auth.uid() = id);
drop policy if exists "users_admin_write" on public.users;
create policy "users_admin_write" on public.users
  for update to authenticated
  using (public.has_permission('users.manage') or auth.uid() = id)
  with check (public.has_permission('users.manage') or auth.uid() = id);
drop policy if exists "roles_admin_all" on public.roles;
create policy "roles_admin_all" on public.roles
  for all to authenticated using (public.has_permission('roles.view'))
  with check (public.has_permission('roles.manage'));
drop policy if exists "permissions_admin_read" on public.permissions;
create policy "permissions_admin_read" on public.permissions
  for select to authenticated using (true);
drop policy if exists "role_permissions_admin_all" on public.role_permissions;
create policy "role_permissions_admin_all" on public.role_permissions
  for all to authenticated using (public.has_permission('roles.view'))
  with check (public.has_permission('roles.manage'));
drop policy if exists "user_permissions_admin_all" on public.user_permissions;
create policy "user_permissions_admin_all" on public.user_permissions
  for all to authenticated using (public.has_permission('users.view'))
  with check (public.has_permission('users.manage'));

-- ===========================================================================
-- Realtime: publish chat tables (conversation + messages) for live updates
-- ===========================================================================
do $$
begin
  alter publication supabase_realtime add table public.live_chat_conversations;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.live_chat_messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null;
end $$;
