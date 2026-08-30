-- ============================================================================
-- Sitekoom — Appointment source (admin-created vs customer request)
-- ============================================================================
alter table public.appointments
  add column if not exists source text not null default 'customer'; -- customer | admin
