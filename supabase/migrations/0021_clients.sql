-- ============================================================================
-- Sitekoom — Client portal (WordPress / custom site clients)
-- Passwords are stored as scrypt hashes, never plaintext.
-- ============================================================================

create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  company       text,
  email         text,
  username      text not null unique,
  password_hash text not null,          -- scrypt "salt:hash"
  website_url   text,
  admin_url     text,
  website_type  text not null default 'wordpress',  -- wordpress | custom | laravel | dotnet | other
  auth_method   text not null default 'sso_token',  -- sso_token | redirect | manual
  status        text not null default 'active',     -- active | inactive
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists clients_username_idx on public.clients (username);
create index if not exists clients_status_idx on public.clients (status);

-- One-time, short-lived SSO tokens (single use, bound to a client + site).
create table if not exists public.client_sso_tokens (
  id         uuid primary key default gen_random_uuid(),
  token      text not null unique,
  client_id  uuid not null references public.clients(id) on delete cascade,
  admin_url  text,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists client_sso_tokens_token_idx on public.client_sso_tokens (token);

-- Permissions
insert into public.permissions (key, name_ar, name_en, group_key, sort) values
  ('clients.view', 'عرض العملاء', 'View Clients', 'clients', 33),
  ('clients.manage', 'إدارة العملاء', 'Manage Clients', 'clients', 34)
on conflict (key) do nothing;

-- Grant to partial admin
insert into public.role_permissions (role_id, permission_key)
select r.id, 'clients.view' from public.roles r where r.key = 'partial_admin'
on conflict do nothing;
insert into public.role_permissions (role_id, permission_key)
select r.id, 'clients.manage' from public.roles r where r.key = 'partial_admin'
on conflict do nothing;

-- RLS: admin-only. The client portal uses server-side service-role code and
-- never exposes clients (or password hashes) to anon/authenticated clients.
alter table public.clients enable row level security;
drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all" on public.clients
  for all to authenticated using (public.has_permission('clients.view'))
  with check (public.has_permission('clients.manage'));

alter table public.client_sso_tokens enable row level security;
drop policy if exists "client_sso_tokens_admin_all" on public.client_sso_tokens;
create policy "client_sso_tokens_admin_all" on public.client_sso_tokens
  for all to authenticated using (public.has_permission('clients.view'))
  with check (public.has_permission('clients.manage'));
