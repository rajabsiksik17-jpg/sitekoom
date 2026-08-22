-- Sitekoom - Renewal transactions + educational video targeting + GA4 linking

alter table public.renewal_requests
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null,
  add column if not exists duration_months integer,
  add column if not exists renewal_duration text;
create index if not exists renewal_requests_subscription_idx on public.renewal_requests (subscription_id);

alter table public.renewal_history
  add column if not exists subscription_id uuid references public.client_subscriptions(id) on delete set null,
  add column if not exists request_id uuid references public.renewal_requests(id) on delete set null,
  add column if not exists duration text,
  add column if not exists days_added integer,
  add column if not exists old_expiry date,
  add column if not exists new_expiry date,
  add column if not exists approved_by uuid references public.users(id) on delete set null,
  add column if not exists approved_at timestamptz;
create index if not exists renewal_history_request_idx on public.renewal_history (request_id);

alter table public.educational_videos
  add column if not exists client_id uuid references public.clients(id) on delete cascade,
  add column if not exists website_id uuid references public.client_websites(id) on delete cascade,
  add column if not exists visibility text not null default 'general';
create index if not exists educational_videos_client_idx on public.educational_videos (client_id);
create index if not exists educational_videos_website_idx on public.educational_videos (website_id);

alter table public.client_websites
  add column if not exists ga4_property_id text,
  add column if not exists ga4_measurement_id text;

-- Fix educational_videos RLS: authenticated admins could not INSERT because only
-- an anon read policy existed. Add a proper admin policy (never USING(true)).
drop policy if exists "educational_videos_admin_all" on public.educational_videos;
create policy "educational_videos_admin_all" on public.educational_videos
  for all to authenticated
  using (public.has_permission('clients.view'))
  with check (public.has_permission('clients.manage'));

-- Public read only exposes general videos (no client/website-specific leaks).
drop policy if exists "educational_videos_public_read" on public.educational_videos;
create policy "educational_videos_public_read" on public.educational_videos
  for select to anon using (is_active = true and visibility = 'general');

-- Ensure renewal_requests stays in the realtime publication (idempotent).
do $$
begin
  alter publication supabase_realtime add table public.renewal_requests;
exception when others then null;
end $$;
