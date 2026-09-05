-- ============================================================================
-- Sitekoom — Permissions management + admin login logs + email notifications
-- ============================================================================
alter table public.permissions add column if not exists description text;
alter table public.permissions add column if not exists is_active boolean not null default true;

alter table public.users add column if not exists notify_email boolean not null default true;

create table if not exists public.admin_login_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  ip_address  text,
  user_agent  text,
  success     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists admin_login_logs_user_idx on public.admin_login_logs (user_id, created_at desc);

alter table public.admin_login_logs enable row level security;

drop policy if exists "admin_login_logs_admin_all" on public.admin_login_logs;
create policy "admin_login_logs_admin_all" on public.admin_login_logs
  for all to authenticated
  using (public.has_permission('users.view'))
  with check (public.has_permission('users.manage'));

-- Respect inactive permissions in the RBAC check.
create or replace function public.has_permission(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or (
      exists (select 1 from public.permissions p where p.key = p_key and p.is_active)
      and (
        exists (
          select 1 from public.user_permissions up
          where up.user_id = auth.uid() and up.permission_key = p_key and up.allowed = true
        )
        or exists (
          select 1
          from public.users u
          join public.role_permissions rp on rp.role_id = u.role_id
          where u.id = auth.uid() and u.status = 'active' and u.deleted_at is null
            and rp.permission_key = p_key
        )
      )
    );
$$;
