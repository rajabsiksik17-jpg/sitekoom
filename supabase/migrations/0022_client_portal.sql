-- ============================================================================
-- Sitekoom — Client Portal expansion
-- Websites, subscriptions, domains, hosting, renewals, notifications,
-- educational videos, email templates/logs, admin OTP.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Client websites (a client may own multiple sites)
-- ---------------------------------------------------------------------------
create table if not exists public.client_websites (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  name         text not null,
  domain       text,
  website_url  text,
  admin_url    text,
  website_type text not null default 'wordpress',  -- wordpress | woocommerce | custom | other
  status       text not null default 'active',     -- active | maintenance | suspended
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists client_websites_client_idx on public.client_websites (client_id);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.client_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  website_id       uuid references public.client_websites(id) on delete set null,
  plan             text,
  start_date       date,
  expiry_date      date,
  renewal_duration text,         -- 1 month | 3 months | 6 months | 1 year | 2 years | custom
  renewal_price    numeric not null default 0,
  status           text not null default 'active',  -- active | expiring | renewal_requested | renewed | expired | suspended
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists client_subscriptions_client_idx on public.client_subscriptions (client_id);

-- ---------------------------------------------------------------------------
-- Domains
-- ---------------------------------------------------------------------------
create table if not exists public.client_domains (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients(id) on delete cascade,
  website_id         uuid references public.client_websites(id) on delete set null,
  domain_name        text not null,
  registration_date  date,
  expiry_date        date,
  renewal_period     text,
  renewal_price      numeric not null default 0,
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists client_domains_client_idx on public.client_domains (client_id);

-- ---------------------------------------------------------------------------
-- Hosting
-- ---------------------------------------------------------------------------
create table if not exists public.client_hosting (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  website_id       uuid references public.client_websites(id) on delete set null,
  provider         text,
  plan             text,
  start_date       date,
  expiry_date      date,
  renewal_period   text,
  renewal_price    numeric not null default 0,
  status           text not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists client_hosting_client_idx on public.client_hosting (client_id);

-- ---------------------------------------------------------------------------
-- Renewal requests + history
-- ---------------------------------------------------------------------------
create table if not exists public.renewal_requests (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  website_id   uuid references public.client_websites(id) on delete set null,
  service_type text not null,       -- subscription | domain | hosting
  service_name text,
  amount       numeric not null default 0,
  status       text not null default 'new',   -- new | in_progress | completed | closed
  message      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists renewal_requests_client_idx on public.renewal_requests (client_id, status);

create table if not exists public.renewal_history (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  website_id   uuid references public.client_websites(id) on delete set null,
  service_type text not null,
  period_label text,
  amount       numeric not null default 0,
  status       text not null default 'renewed',
  created_at   timestamptz not null default now()
);
create index if not exists renewal_history_client_idx on public.renewal_history (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Link live-chat conversations to registered clients (auto identity + priority)
-- ---------------------------------------------------------------------------
alter table public.live_chat_conversations
  add column if not exists client_id    uuid references public.clients(id) on delete set null,
  add column if not exists is_registered boolean not null default false;
create index if not exists chat_conversations_client_idx on public.live_chat_conversations (client_id);

-- ---------------------------------------------------------------------------
-- Renewal reminders (dedupe for the 90/30-day email schedule)
-- ---------------------------------------------------------------------------
create table if not exists public.renewal_reminders (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  service_type text not null,        -- subscription | domain | hosting
  service_id   uuid not null,
  due_date     date not null,
  days_before  integer not null,     -- 90 | 30
  sent_at      timestamptz not null default now(),
  unique (service_type, service_id, days_before)
);

-- ---------------------------------------------------------------------------
-- Client notifications
-- ---------------------------------------------------------------------------
create table if not exists public.client_notifications (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  type       text not null default 'info',
  title_ar   text not null,
  title_en   text not null,
  body_ar    text,
  body_en    text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists client_notifications_client_idx on public.client_notifications (client_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- Educational videos
-- ---------------------------------------------------------------------------
create table if not exists public.educational_videos (
  id            uuid primary key default gen_random_uuid(),
  title_ar      text not null,
  title_en      text not null,
  description_ar text,
  description_en text,
  youtube_url   text not null,
  target_type   text not null default 'all',  -- all | wordpress | woocommerce | custom | other
  is_active     boolean not null default true,
  sort          integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists educational_videos_active_idx on public.educational_videos (is_active, sort);

-- ---------------------------------------------------------------------------
-- Email templates (dynamic, bilingual)
-- ---------------------------------------------------------------------------
create table if not exists public.email_templates (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  subject_ar text,
  subject_en text,
  body_ar    text,
  body_en    text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Email logs
-- ---------------------------------------------------------------------------
create table if not exists public.email_logs (
  id         uuid primary key default gen_random_uuid(),
  type       text,
  recipient  text,
  subject    text,
  status     text not null default 'sent',  -- sent | failed
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists email_logs_created_idx on public.email_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Admin OTP (hashed, single-use, short-lived)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_otp (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  attempts   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists admin_otp_user_idx on public.admin_otp (user_id, used_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.client_websites       enable row level security;
alter table public.client_subscriptions  enable row level security;
alter table public.client_domains        enable row level security;
alter table public.client_hosting        enable row level security;
alter table public.renewal_requests      enable row level security;
alter table public.renewal_history       enable row level security;
alter table public.client_notifications  enable row level security;
alter table public.educational_videos    enable row level security;
alter table public.email_templates       enable row level security;
alter table public.email_logs            enable row level security;
alter table public.admin_otp             enable row level security;

-- Client data is accessed server-side (service role) — clients are NOT Supabase
-- auth users. Only Sitekoom admins may read/write via RLS.
do $$
declare t text;
begin
  foreach t in array array[
    'client_websites','client_subscriptions','client_domains','client_hosting',
    'renewal_requests','renewal_history','renewal_reminders','client_notifications',
    'email_templates','email_logs','admin_otp'
  ]
  loop
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.has_permission(''clients.view'')) with check (public.has_permission(''clients.manage''))', t, t);
  end loop;
end $$;

-- Educational videos are public read (shown to clients/visitors).
drop policy if exists "educational_videos_public_read" on public.educational_videos;
create policy "educational_videos_public_read" on public.educational_videos
  for select to anon using (is_active = true);

-- Email settings + notification email (site_settings key)
insert into public.site_settings (key, value, is_public) values
  ('email', '{
    "notification_email": "",
    "from_name": "Sitekoom",
    "from_email": "no-reply@sitekoom.com",
    "otp_enabled": false,
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_username": "",
    "smtp_password": "",
    "smtp_encryption": "tls",
    "imap_host": "",
    "imap_port": 993,
    "imap_username": "",
    "imap_password": "",
    "imap_encryption": "ssl"
  }'::jsonb, false)
on conflict (key) do nothing;

-- Default email templates
insert into public.email_templates (key, subject_ar, subject_en, body_ar, body_en) values
  ('contact_confirmation', 'تم استلام رسالتك بنجاح', 'We received your message',
   'مرحبًا {name}،<br/><br/>تم استلام رسالتك بنجاح، وسيقوم فريق Sitekoom بمراجعتها والرد عليك في أقرب وقت ممكن.<br/><br/>مع خالص التحية،<br/>فريق سايتكم',
   'Hi {name},<br/><br/>We received your message successfully. The Sitekoom team will review it and get back to you as soon as possible.<br/><br/>Best regards,<br/>The Sitekoom Team'),
  ('pricing_confirmation', 'تم استلام طلب التسعير الخاص بك', 'We received your pricing request',
   'مرحبًا {name}،<br/><br/>تم استلام طلب التسعير الخاص بك بنجاح، وسيقوم فريق Sitekoom بمراجعته والتواصل معك قريبًا.<br/><br/>مع خالص التحية،<br/>فريق سايتكم',
   'Hi {name},<br/><br/>We received your pricing request successfully. The Sitekoom team will review it and contact you soon.<br/><br/>Best regards,<br/>The Sitekoom Team'),
  ('client_welcome', 'مرحبًا بك في بوابة عملاء سايتكم', 'Welcome to the Sitekoom Client Portal',
   'مرحبًا {name}،<br/><br/>تم إنشاء حسابك في بوابة عملاء سايتكم بنجاح.<br/>رابط البوابة: {portal_url}<br/><br/>يمكنك تسجيل الدخول باستخدام اسم المستخدم الخاص بك والوصول إلى مواقعك وأنظمتك.<br/><br/>مع خالص التحية،<br/>فريق سايتكم',
   'Hi {name},<br/><br/>Your Sitekoom Client Portal account has been created.<br/>Portal link: {portal_url}<br/><br/>You can log in with your username to access your websites and systems.<br/><br/>Best regards,<br/>The Sitekoom Team'),
  ('renewal_reminder', 'تذكير: خدمتك ستنتهي قريبًا', 'Reminder: your service is expiring soon',
   'مرحبًا {name}،<br/><br/>نود تذكيرك بأن {service} الخاص بموقع {site} سينتهي في {expiry_date} ({days_left} يوم متبقي).<br/>قيمة التجديد: {amount}<br/><br/>يمكنك طلب التجديد من خلال بوابة العملاء: {portal_url}<br/><br/>مع خالص التحية،<br/>فريق سايتكم',
   'Hi {name},<br/><br/>This is a reminder that the {service} for {site} will expire on {expiry_date} ({days_left} days remaining).<br/>Renewal price: {amount}<br/><br/>You can request a renewal from the client portal: {portal_url}<br/><br/>Best regards,<br/>The Sitekoom Team')
on conflict (key) do nothing;
