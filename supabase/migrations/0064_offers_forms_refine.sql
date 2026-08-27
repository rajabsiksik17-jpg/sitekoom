-- ============================================================================
-- Sitekoom — Offers / Forms refinements
-- ============================================================================
alter table public.form_submissions
  add column if not exists subject text;

alter table public.dynamic_forms
  add column if not exists placement text not null default 'custom'; -- contact|pricing_request|offer|live_chat|custom
