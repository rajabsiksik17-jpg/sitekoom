-- ============================================================================
-- Sitekoom — Default addons are included in the base price
-- ============================================================================
alter table public.offer_addons
  add column if not exists is_default boolean not null default false;
