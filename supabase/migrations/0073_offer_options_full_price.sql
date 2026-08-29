-- ============================================================================
-- Sitekoom — Offer options represent the FULL project price (not a delta)
-- ============================================================================
alter table public.offer_option_values
  add column if not exists price numeric not null default 0;

-- Preserve existing values as a starting point for the new full-price semantics.
update public.offer_option_values set price = price_delta where price = 0 and price_delta <> 0;
