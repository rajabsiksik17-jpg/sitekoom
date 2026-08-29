-- ============================================================================
-- Sitekoom — Email reply tracking + review source marker
-- ============================================================================
alter table public.form_submissions
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by uuid references public.users(id) on delete set null;

alter table public.google_reviews
  add column if not exists source text not null default 'google'; -- google | manual
