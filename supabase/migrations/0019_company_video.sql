-- ============================================================================
-- Sitekoom — Company video + gallery media kinds
-- ============================================================================

alter table public.company_info add column if not exists video_url text;
alter table public.company_images add column if not exists kind text not null default 'image';
