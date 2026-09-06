-- ============================================================================
-- Sitekoom — Project website screenshot (optional preview image)
-- (legacy: superseded by the portfolio website_screenshot item; column dropped
--  in 0086 to avoid a redundant field)
-- ============================================================================
alter table public.projects
  add column if not exists website_screenshot text;
