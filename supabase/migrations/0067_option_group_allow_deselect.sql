-- ============================================================================
-- Sitekoom — Allow deselect for offer option groups
-- ============================================================================
alter table public.offer_option_groups
  add column if not exists allow_deselect boolean not null default false;
