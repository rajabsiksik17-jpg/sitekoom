-- ============================================================================
-- Sitekoom — Remove the redundant projects.website_screenshot column
-- The desktop website screenshot already lives in project_portfolio_items
-- (type = 'website_screenshot') and is the single source of truth.
-- ============================================================================
alter table public.projects
  drop column if exists website_screenshot;
