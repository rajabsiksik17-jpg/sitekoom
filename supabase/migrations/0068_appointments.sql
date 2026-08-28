-- ============================================================================
-- Sitekoom — Appointments (booking requests, double-booking prevention)
-- ============================================================================

create extension if not exists btree_gist;

create table if not exists public.appointments (
  id                uuid primary key default gen_random_uuid(),
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  service_ids       uuid[] not null default '{}',
  subject           text not null,
  notes             text,
  language          text not null default 'ar',
  requested_date    date not null,
  requested_time    time not null,
  duration_minutes  integer not null default 120,
  status            text not null default 'new',  -- new|reviewing|approved|rejected|awaiting_client|rescheduled|completed|cancelled
  start_at          timestamptz,
  end_at            timestamptz,
  proposed_start_at timestamptz,
  proposed_end_at   timestamptz,
  old_start_at      timestamptz,
  old_end_at        timestamptz,
  admin_note        text,
  reject_reason     text,
  reschedule_reason text,
  confirm_token     text unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists appointments_status_idx on public.appointments (status, created_at desc);
create index if not exists appointments_date_idx on public.appointments (requested_date);
create index if not exists appointments_start_idx on public.appointments (start_at);

-- Prevent two confirmed (booked) appointments from overlapping in time.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_no_overlap'
  ) then
    alter table public.appointments
      add constraint appointments_no_overlap
      exclude using gist (tstzrange(start_at, end_at) with &&)
      where (status in ('approved', 'rescheduled', 'completed'));
  end if;
end $$;

-- Appointment settings stored in the existing site_settings key/value table.
insert into public.site_settings (key, value, is_public) values
  ('appointment', '{"work_days":[0,1,2,3,4,5,6],"off_days":[],"start_time":"09:00","end_time":"17:00","duration_minutes":120,"lead_days":0,"max_days_ahead":30}'::jsonb, true)
on conflict (key) do nothing;

-- Permissions
insert into public.permissions (key, name_ar, name_en, group_key, sort) values
  ('appointments.view','عرض المواعيد','View Appointments','appointments',42),
  ('appointments.manage','إدارة المواعيد','Manage Appointments','appointments',43)
on conflict (key) do nothing;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.appointments enable row level security;

drop policy if exists "appointments_admin_all" on public.appointments;
create policy "appointments_admin_all" on public.appointments
  for all to authenticated
  using (public.has_permission('appointments.view'))
  with check (public.has_permission('appointments.manage'));
