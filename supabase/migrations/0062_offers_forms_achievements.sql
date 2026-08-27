-- ============================================================================
-- Sitekoom — Offers, Dynamic Forms, Achievements (schema + RLS)
-- Additive only. No existing tables modified or dropped.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (key, name_ar, name_en, group_key, sort) values
  ('offers.view','عرض العروض','View Offers','offers',34),
  ('offers.manage','إدارة العروض','Manage Offers','offers',35),
  ('forms.view','عرض النماذج','View Forms','forms',36),
  ('forms.manage','إدارة النماذج','Manage Forms','forms',37),
  ('submissions.view','عرض طلبات النماذج','View Form Submissions','forms',38),
  ('submissions.manage','إدارة طلبات النماذج','Manage Form Submissions','forms',39),
  ('achievements.view','عرض الإنجازات','View Achievements','achievements',40),
  ('achievements.manage','إدارة الإنجازات','Manage Achievements','achievements',41)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Dynamic forms
-- ---------------------------------------------------------------------------
create table if not exists public.dynamic_forms (
  id                  uuid primary key default gen_random_uuid(),
  key                 text not null unique,       -- internal reference key
  title_ar            text not null default '',
  title_en            text not null default '',
  description_ar      text,
  description_en      text,
  success_message_ar  text,
  success_message_en  text,
  error_message_ar    text,
  error_message_en    text,
  redirect_url        text,
  notify_admin        boolean not null default true,
  is_active           boolean not null default true,
  sort                integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists dynamic_forms_key_idx on public.dynamic_forms (key);

create table if not exists public.dynamic_form_fields (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid not null references public.dynamic_forms(id) on delete cascade,
  field_key    text not null,                     -- internal name
  type         text not null default 'text',      -- text|textarea|email|phone|number|url|date|select|multiselect|radio|checkbox|checkbox_group|switch|file|country|city|address|section|description|consent|hidden|...
  label_ar     text not null default '',
  label_en     text not null default '',
  placeholder_ar text,
  placeholder_en text,
  description_ar text,
  description_en text,
  required     boolean not null default false,
  default_value text,
  width        text not null default '100',       -- 100|50|33|25
  validation   jsonb not null default '{}'::jsonb, -- min/max/minLength/maxLength/pattern/accept/maxSize/multiple
  pricing      jsonb not null default '{}'::jsonb, -- {enabled:bool, price_delta:number}
  enabled      boolean not null default true,
  sort         integer not null default 0
);
create index if not exists dff_form_idx on public.dynamic_form_fields (form_id, sort);

create table if not exists public.dynamic_form_options (
  id          uuid primary key default gen_random_uuid(),
  field_id    uuid not null references public.dynamic_form_fields(id) on delete cascade,
  label_ar    text not null default '',
  label_en    text not null default '',
  value       text not null default '',
  price_delta numeric not null default 0,
  enabled     boolean not null default true,
  sort        integer not null default 0
);
create index if not exists dfo_field_idx on public.dynamic_form_options (field_id, sort);

create table if not exists public.dynamic_form_rules (
  id                 uuid primary key default gen_random_uuid(),
  form_id            uuid not null references public.dynamic_forms(id) on delete cascade,
  field_id           uuid references public.dynamic_form_fields(id) on delete cascade,
  condition_field_id uuid references public.dynamic_form_fields(id) on delete cascade,
  operator           text not null default 'equals', -- equals|not_equals|contains
  value              text not null default '',
  action             text not null default 'show',   -- show|hide
  sort               integer not null default 0
);
create index if not exists dfr_form_idx on public.dynamic_form_rules (form_id);

-- ---------------------------------------------------------------------------
-- Offers (dynamic pricing)
-- ---------------------------------------------------------------------------
create table if not exists public.offers (
  id             uuid primary key default gen_random_uuid(),
  title_ar       text not null,
  title_en       text not null,
  slug           text not null unique,
  main_image     text,
  short_desc_ar  text,
  short_desc_en  text,
  full_desc_ar   text,
  full_desc_en   text,
  base_price     numeric not null default 0,
  currency       text not null default 'JOD',
  pricing_type   text not null default 'simple',   -- simple|options|addons|packages|custom_quote
  price_display  text not null default 'fixed',    -- fixed|starting_from|request_quote|hide|dynamic
  duration       text,
  status         text not null default 'draft',    -- draft|published|hidden
  start_date     timestamptz,
  end_date       timestamptz,
  is_featured    boolean not null default false,
  sort           integer not null default 0,
  form_id        uuid references public.dynamic_forms(id) on delete set null,
  service_ids    uuid[] not null default '{}',
  cta_text_ar    text,
  cta_text_en    text,
  cta_url        text,
  chat_text_ar   text,
  chat_text_en   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists offers_status_idx on public.offers (status, sort);

create table if not exists public.offer_images (
  id       uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  url      text not null,
  alt      text,
  sort     integer not null default 0
);
create index if not exists offer_images_offer_idx on public.offer_images (offer_id);

create table if not exists public.offer_stages (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  title_ar       text not null default '',
  title_en       text not null default '',
  description_ar text,
  description_en text,
  duration       text,
  icon           text,
  enabled        boolean not null default true,
  sort           integer not null default 0
);
create index if not exists offer_stages_offer_idx on public.offer_stages (offer_id, sort);

create table if not exists public.offer_included_items (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  title_ar       text not null default '',
  title_en       text not null default '',
  description_ar text,
  description_en text,
  icon           text,
  enabled        boolean not null default true,
  sort           integer not null default 0
);
create index if not exists offer_included_offer_idx on public.offer_included_items (offer_id, sort);

create table if not exists public.offer_features (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  title_ar       text not null default '',
  title_en       text not null default '',
  description_ar text,
  description_en text,
  icon           text,
  sort           integer not null default 0
);
create index if not exists offer_features_offer_idx on public.offer_features (offer_id, sort);

create table if not exists public.offer_option_groups (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  title_ar       text not null default '',
  title_en       text not null default '',
  selection_type text not null default 'single',  -- single|multiple
  required       boolean not null default false,
  sort           integer not null default 0
);
create index if not exists offer_options_offer_idx on public.offer_option_groups (offer_id, sort);

create table if not exists public.offer_option_values (
  id          uuid primary key default gen_random_uuid(),
  option_id   uuid not null references public.offer_option_groups(id) on delete cascade,
  label_ar    text not null default '',
  label_en    text not null default '',
  price_delta numeric not null default 0,
  is_default  boolean not null default false,
  enabled     boolean not null default true,
  sort        integer not null default 0
);
create index if not exists offer_option_values_idx on public.offer_option_values (option_id, sort);

create table if not exists public.offer_addons (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  title_ar       text not null default '',
  title_en       text not null default '',
  description_ar text,
  description_en text,
  price          numeric not null default 0,
  enabled        boolean not null default true,
  sort           integer not null default 0
);
create index if not exists offer_addons_offer_idx on public.offer_addons (offer_id, sort);

create table if not exists public.offer_packages (
  id             uuid primary key default gen_random_uuid(),
  offer_id       uuid not null references public.offers(id) on delete cascade,
  name_ar        text not null default '',
  name_en        text not null default '',
  description_ar text,
  description_en text,
  price          numeric not null default 0,
  duration       text,
  features       text[] not null default '{}',
  is_default     boolean not null default false,
  sort           integer not null default 0
);
create index if not exists offer_packages_offer_idx on public.offer_packages (offer_id, sort);

create table if not exists public.offer_pricing_rules (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references public.offers(id) on delete cascade,
  title_ar    text not null default '',
  title_en    text not null default '',
  condition   jsonb not null default '{}'::jsonb, -- {field_key, operator, value}
  price_delta numeric not null default 0,
  enabled     boolean not null default true,
  sort        integer not null default 0
);
create index if not exists offer_rules_offer_idx on public.offer_pricing_rules (offer_id, sort);

-- ---------------------------------------------------------------------------
-- Form submissions (with pricing snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.form_submissions (
  id                     uuid primary key default gen_random_uuid(),
  form_id                uuid references public.dynamic_forms(id) on delete set null,
  offer_id               uuid references public.offers(id) on delete set null,
  status                 text not null default 'new',  -- new|contacted|in_progress|quoted|approved|rejected|completed|archived
  customer_name          text,
  customer_email         text,
  customer_phone         text,
  language               text not null default 'ar',
  page_url               text,
  source                 text,
  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  utm_term               text,
  utm_content            text,
  ip_hash                text,
  user_agent             text,
  base_price             numeric,
  currency               text,
  calculated_total       numeric,
  selected_options       jsonb not null default '[]'::jsonb,  -- snapshot
  selected_addons        jsonb not null default '[]'::jsonb,  -- snapshot
  pricing_rules_applied  jsonb not null default '[]'::jsonb,  -- snapshot
  custom_admin_price     numeric,
  final_admin_price      numeric,
  price_note             text,
  priced_by              uuid references public.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists form_submissions_form_idx on public.form_submissions (form_id, created_at desc);
create index if not exists form_submissions_status_idx on public.form_submissions (status, created_at desc);

create table if not exists public.form_submission_values (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.form_submissions(id) on delete cascade,
  field_key     text not null default '',
  field_label   text,
  value         text,
  price_delta   numeric not null default 0,
  sort          integer not null default 0
);
create index if not exists fsv_submission_idx on public.form_submission_values (submission_id);

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
create table if not exists public.achievements (
  id              uuid primary key default gen_random_uuid(),
  title_ar        text not null,
  title_en        text not null,
  slug            text not null unique,
  main_image      text,
  short_desc_ar   text,
  short_desc_en   text,
  full_desc_ar    text,
  full_desc_en    text,
  type            text,
  category        text,
  date            date,
  website_url     text,
  project_url     text,
  external_url    text,
  iframe_url      text,
  demo_url        text,
  display_website boolean not null default false,
  video_url       text,
  challenge_ar    text,
  challenge_en    text,
  solution_ar     text,
  solution_en     text,
  results_ar      text,
  results_en      text,
  service_ids     uuid[] not null default '{}',
  technologies    text[] not null default '{}',
  status_field    public.publish_status not null default 'draft',
  is_featured     boolean not null default false,
  sort            integer not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists achievements_status_idx on public.achievements (status_field, sort);

create table if not exists public.achievement_images (
  id             uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  url            text not null,
  alt            text,
  sort           integer not null default 0
);
create index if not exists achievement_images_idx on public.achievement_images (achievement_id);

create table if not exists public.achievement_features (
  id             uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  title_ar       text not null default '',
  title_en       text not null default '',
  description_ar text,
  description_en text,
  icon           text,
  sort           integer not null default 0
);
create index if not exists achievement_features_idx on public.achievement_features (achievement_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.dynamic_forms enable row level security;
alter table public.dynamic_form_fields enable row level security;
alter table public.dynamic_form_options enable row level security;
alter table public.dynamic_form_rules enable row level security;
alter table public.offers enable row level security;
alter table public.offer_images enable row level security;
alter table public.offer_stages enable row level security;
alter table public.offer_included_items enable row level security;
alter table public.offer_features enable row level security;
alter table public.offer_option_groups enable row level security;
alter table public.offer_option_values enable row level security;
alter table public.offer_addons enable row level security;
alter table public.offer_packages enable row level security;
alter table public.offer_pricing_rules enable row level security;
alter table public.form_submissions enable row level security;
alter table public.form_submission_values enable row level security;
alter table public.achievements enable row level security;
alter table public.achievement_images enable row level security;
alter table public.achievement_features enable row level security;

-- Public read: published offers (and children), active forms, published achievements.
drop policy if exists "offers_public_read" on public.offers;
create policy "offers_public_read" on public.offers
  for select to anon using (status = 'published' and deleted_at is null and (end_date is null or end_date >= now()));

do $$
declare t text;
begin
  foreach t in array array[
    'offer_images','offer_stages','offer_included_items','offer_features',
    'offer_option_groups','offer_addons','offer_packages','offer_pricing_rules'
  ]
  loop
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format('create policy %I_public_read on public.%I for select to anon using (exists (select 1 from public.offers o where o.id = %I.offer_id and o.status = ''published'' and o.deleted_at is null))', t, t, t);
  end loop;
end $$;

drop policy if exists "offer_option_values_public_read" on public.offer_option_values;
create policy "offer_option_values_public_read" on public.offer_option_values
  for select to anon using (
    exists (
      select 1 from public.offer_option_groups g
      join public.offers o on o.id = g.offer_id
      where g.id = offer_option_values.option_id and o.status = 'published' and o.deleted_at is null
    )
  );

drop policy if exists "dynamic_forms_public_read" on public.dynamic_forms;
create policy "dynamic_forms_public_read" on public.dynamic_forms
  for select to anon using (is_active = true);

do $$
declare t text;
begin
  foreach t in array array['dynamic_form_fields','dynamic_form_rules']
  loop
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format('create policy %I_public_read on public.%I for select to anon using (exists (select 1 from public.dynamic_forms f where f.id = %I.form_id and f.is_active = true))', t, t, t);
  end loop;
end $$;

drop policy if exists "dynamic_form_options_public_read" on public.dynamic_form_options;
create policy "dynamic_form_options_public_read" on public.dynamic_form_options
  for select to anon using (
    exists (
      select 1 from public.dynamic_form_fields f
      join public.dynamic_forms df on df.id = f.form_id
      where f.id = dynamic_form_options.field_id and df.is_active = true
    )
  );

drop policy if exists "achievements_public_read" on public.achievements;
create policy "achievements_public_read" on public.achievements
  for select to anon using (status_field = 'published' and deleted_at is null);

do $$
declare t text;
begin
  foreach t in array array['achievement_images','achievement_features']
  loop
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format('create policy %I_public_read on public.%I for select to anon using (exists (select 1 from public.achievements a where a.id = %I.achievement_id and a.status_field = ''published'' and a.deleted_at is null))', t, t, t);
  end loop;
end $$;

-- Admin policies (no public write on submissions — server-side only).
do $$
declare t text;
begin
  foreach t in array array[
    'offers','offer_images','offer_stages','offer_included_items','offer_features',
    'offer_option_groups','offer_option_values','offer_addons','offer_packages','offer_pricing_rules'
  ]
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.has_permission(''offers.view'')) with check (public.has_permission(''offers.manage''))', t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['dynamic_forms','dynamic_form_fields','dynamic_form_options','dynamic_form_rules']
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.has_permission(''forms.view'')) with check (public.has_permission(''forms.manage''))', t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['form_submissions','form_submission_values']
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.has_permission(''submissions.view'')) with check (public.has_permission(''submissions.manage''))', t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['achievements','achievement_images','achievement_features']
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.has_permission(''achievements.view'')) with check (public.has_permission(''achievements.manage''))', t, t);
  end loop;
end $$;
