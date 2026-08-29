-- ============================================================================
-- Sitekoom — Appointment reschedule: client approval token expiry
-- ============================================================================
alter table public.appointments
  add column if not exists confirm_token_expires_at timestamptz;
