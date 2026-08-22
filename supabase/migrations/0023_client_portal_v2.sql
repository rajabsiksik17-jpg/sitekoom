-- ============================================================================
-- Sitekoom — Client Portal v2
-- Client profile enrichment, website credentials (encrypted), smart
-- subscriptions, support conversation types, configurable support reasons,
-- trusted devices + OTP, login logs, and realtime publication for requests.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Company info: video section title + intro (homepage "company video" block)
-- ---------------------------------------------------------------------------
alter table public.company_info
  add column if not exists video_title_ar text,
  add column if not exists video_title_en text,
  add column if not exists video_intro_ar text,
  add column if not exists video_intro_en text;

-- ---------------------------------------------------------------------------
-- Clients: phone + preferred language
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists phone text,
  add column if not exists preferred_language text not null default 'ar';

-- ---------------------------------------------------------------------------
-- Client websites: separate login credentials for the client's own site.
-- Credentials are AES-256-GCM encrypted (never plaintext), never exposed via
-- frontend, URLs, or list API responses.
-- ---------------------------------------------------------------------------
alter table public.client_websites
  add column if not exists login_username text,
  add column if not exists login_email text,
  add column if not exists credentials_encrypted text,
  add column if not exists credentials_type text not null default 'none'; -- wordpress | custom | none

-- ---------------------------------------------------------------------------
-- Central subscription record: duration + whether it covers domain/hosting
-- (so a single "1 year" renewal drives all three expiry dates).
-- ---------------------------------------------------------------------------
alter table public.client_subscriptions
  add column if not exists duration_months integer,
  add column if not exists covers_domain boolean not null default true,
  add column if not exists covers_hosting boolean not null default true;

-- ---------------------------------------------------------------------------
-- Live chat: conversation classification (type + reason).
-- ---------------------------------------------------------------------------
alter table public.live_chat_conversations
  add column if not exists conversation_type text, -- general | modification | maintenance | renewal | hosting | domain | development | wordpress | woocommerce | other
  add column if not exists support_reason text;

-- ---------------------------------------------------------------------------
-- Configurable support reasons (admin-managed).
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value, is_public) values
  ('support_reasons', '{
    "items": [
      {"value": "website_modification", "ar": "تعديل على الموقع", "en": "Website modification"},
      {"value": "website_issue", "ar": "مشكلة في الموقع", "en": "Website issue"},
      {"value": "maintenance", "ar": "صيانة", "en": "Maintenance"},
      {"value": "development", "ar": "طلب تطوير جديد", "en": "New development request"},
      {"value": "renewal", "ar": "طلب تجديد", "en": "Renewal request"},
      {"value": "inquiry", "ar": "استفسار", "en": "Inquiry"},
      {"value": "hosting", "ar": "مشكلة في الاستضافة", "en": "Hosting issue"},
      {"value": "domain", "ar": "مشكلة في الدومين", "en": "Domain issue"},
      {"value": "woocommerce", "ar": "WooCommerce", "en": "WooCommerce"},
      {"value": "wordpress", "ar": "WordPress", "en": "WordPress"},
      {"value": "other", "ar": "أخرى", "en": "Other"}
    ]
  }'::jsonb, true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Trusted devices (admin 2FA skip) + OTP for clients.
-- ---------------------------------------------------------------------------
create table if not exists public.trusted_devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token_hash  text not null,
  device_name text,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists trusted_devices_user_idx on public.trusted_devices (user_id);

create table if not exists public.client_otp (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  attempts   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists client_otp_client_idx on public.client_otp (client_id, used_at);

create table if not exists public.client_trusted_devices (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  token_hash  text not null,
  device_name text,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists client_trusted_devices_client_idx on public.client_trusted_devices (client_id);

-- ---------------------------------------------------------------------------
-- Client login logs (time, device, browser, IP when privacy allows).
-- ---------------------------------------------------------------------------
create table if not exists public.client_login_logs (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete set null,
  ip_address  text,
  user_agent  text,
  success     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists client_login_logs_client_idx on public.client_login_logs (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — client data remains server-side (service role) only. Admins access
-- trusted_devices via their own user id; admin OTP/trusted devices admin-only.
-- ---------------------------------------------------------------------------
alter table public.trusted_devices         enable row level security;
alter table public.client_otp              enable row level security;
alter table public.client_trusted_devices  enable row level security;
alter table public.client_login_logs       enable row level security;

drop policy if exists "trusted_devices_self" on public.trusted_devices;
create policy "trusted_devices_self" on public.trusted_devices
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['client_otp','client_trusted_devices','client_login_logs']
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.has_permission(''clients.view'')) with check (public.has_permission(''clients.manage''))', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime publication: request tables must be published for the admin
-- notification center to receive INSERT events without a refresh.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['contact_requests','project_requests','renewal_requests','live_chat_conversations','live_chat_messages','notifications']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;
