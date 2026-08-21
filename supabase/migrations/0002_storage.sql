-- ============================================================================
-- Sitekoom — Storage buckets + policies
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('media', 'media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read access for public buckets (already implicit, but be explicit)
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id in ('media', 'avatars'));

-- Admin upload/update/delete guarded by media.manage permission
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('media', 'avatars')
    and public.has_permission('media.manage')
  );

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated using (
    bucket_id in ('media', 'avatars')
    and public.has_permission('media.manage')
  );

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete to authenticated using (
    bucket_id in ('media', 'avatars')
    and public.has_permission('media.manage')
  );
