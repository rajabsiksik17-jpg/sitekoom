-- ============================================================================
-- Sitekoom — Project website screenshot (optional preview image)
-- ============================================================================
alter table public.projects
  add column if not exists website_screenshot text;
