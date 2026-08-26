-- ============================================================================
-- Sitekoom — Service category portfolio defaults
-- Each service category can define default portfolio settings; a service can
-- override them with its own. Effective settings = service override if set,
-- otherwise the service's category defaults.
-- ============================================================================
alter table public.service_categories
  add column if not exists portfolio_config text[] not null default '{}';
