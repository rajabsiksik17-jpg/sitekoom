-- ============================================================================
-- Sitekoom — Service project cover image (1:1)
-- Projects reuse their service's cover; only the service stores it once.
-- ============================================================================
alter table public.services
  add column if not exists works_image text;
