-- ============================================================================
-- Sitekoom — Media Library: file hashing + storage path (dedup / merge)
-- ============================================================================
alter table public.media add column if not exists hash text;
alter table public.media add column if not exists storage_path text;
create index if not exists media_hash_idx on public.media (hash);
