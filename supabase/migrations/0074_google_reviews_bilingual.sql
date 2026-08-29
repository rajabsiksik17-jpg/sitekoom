-- ============================================================================
-- Sitekoom — Google Reviews: bilingual manual review fields
-- ============================================================================
alter table public.google_reviews add column if not exists text_ar text;
alter table public.google_reviews add column if not exists text_en text;
alter table public.google_reviews add column if not exists language text;

-- Preserve existing review text as Arabic (the fetcher requests Arabic).
update public.google_reviews set text_ar = text where text_ar is null and text is not null;
