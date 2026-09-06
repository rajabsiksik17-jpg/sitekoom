-- ============================================================================
-- Sitekoom — Project logo + company value icons metadata
-- Additive only. No data touched.
-- ============================================================================
alter table public.projects
  add column if not exists logo text;

-- Index-aligned metadata for company values (values_ar / values_en hold titles).
-- Each entry: { "icon": "star", "desc_ar": "...", "desc_en": "..." }
alter table public.company_info
  add column if not exists values_meta jsonb not null default '[]'::jsonb;
