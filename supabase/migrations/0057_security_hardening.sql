-- ============================================================================
-- Sitekoom — Security hardening (Supabase Security Advisor remediation)
-- Safe, reversible: no data deleted, no tables/functions dropped, no app
-- behaviour changed. Enables RLS on the one table missing it, locks down
-- over-permissive policies, and scopes anonymous live-chat access to the
-- unguessable visitor_token via a signed `chat_token` JWT claim.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A1. renewal_reminders: RLS was never enabled (only table in the schema).
--     The admin policy (renewal_reminders_admin_all) already exists and
--     becomes active once RLS is on. Server code uses the service role, which
--     bypasses RLS, so nothing breaks.
-- ---------------------------------------------------------------------------
alter table public.renewal_reminders enable row level security;

-- ---------------------------------------------------------------------------
-- A2. prevent_closed_chat_message(): SECURITY DEFINER without a locked
--     search_path. Recreate with an explicit, safe search_path (same body).
-- ---------------------------------------------------------------------------
create or replace function public.prevent_closed_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.live_chat_conversations c
    where c.id = new.conversation_id and c.status = 'closed'
  ) then
    raise exception 'Conversation is closed';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- A3. audit_logs: remove the authenticated INSERT policy (any authenticated
--     user could forge audit entries). Audit inserts already happen only via
--     the service role (server routes), so dropping it is safe.
-- ---------------------------------------------------------------------------
drop policy if exists "audit_admin_insert" on public.audit_logs;

-- ---------------------------------------------------------------------------
-- A4. permissions: the catalog was readable by any authenticated user via
--     USING (true). Restrict to roles.view (matches the roles manager UI).
-- ---------------------------------------------------------------------------
drop policy if exists "permissions_admin_read" on public.permissions;
create policy "permissions_admin_read" on public.permissions
  for select to authenticated using (public.has_permission('roles.view'));

-- ---------------------------------------------------------------------------
-- C1. notifications: write (INSERT/UPDATE/DELETE) was gated only by the *view*
--     permission. Split into:
--       - UPDATE (mark-as-read) kept on notifications.view (no behaviour change)
--       - INSERT / DELETE now require notifications.manage
--     Notifications are otherwise inserted server-side via the service role.
-- ---------------------------------------------------------------------------
insert into public.permissions (key, name_ar, name_en, group_key, sort)
values ('notifications.manage', 'إدارة الإشعارات', 'Manage Notifications', 'notifications', 33)
on conflict (key) do nothing;

drop policy if exists "notifications_admin_write" on public.notifications;
create policy "notifications_admin_update" on public.notifications
  for update to authenticated using (public.has_permission('notifications.view'));
create policy "notifications_admin_insert" on public.notifications
  for insert to authenticated with check (public.has_permission('notifications.manage'));
create policy "notifications_admin_delete" on public.notifications
  for delete to authenticated using (public.has_permission('notifications.manage'));

-- ---------------------------------------------------------------------------
-- D3. Drop unused anon INSERT policies for leads. contact_requests and
--     project_requests are inserted server-side via the service role, never
--     from the browser, so the public insert policies are dead attack surface.
--     analytics_events is left untouched (browser analytics uses it).
-- ---------------------------------------------------------------------------
drop policy if exists "contact_requests_public_insert" on public.contact_requests;
drop policy if exists "project_requests_public_insert" on public.project_requests;

-- ---------------------------------------------------------------------------
-- B1. Live chat: replace `USING (true)` anon policies with token-scoped
--     policies. The anonymous browser is authenticated by a signed JWT whose
--     `chat_token` claim equals the conversation's unguessable visitor_token.
--     (Realtime uses the same RLS policies, so visitors only receive events
--     for their own conversation.)
-- ---------------------------------------------------------------------------

-- Conversations: no anonymous INSERT (created server-side); SELECT scoped.
drop policy if exists "chat_conversations_public_insert" on public.live_chat_conversations;
drop policy if exists "chat_conversations_public_read" on public.live_chat_conversations;
create policy "chat_conversations_public_read" on public.live_chat_conversations
  for select to anon
  using (visitor_token::text = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'chat_token', ''));

-- Participants: not referenced by the app — remove anon access entirely.
drop policy if exists "chat_participants_public_insert" on public.live_chat_participants;
drop policy if exists "chat_participants_public_read" on public.live_chat_participants;

-- Messages: SELECT + INSERT scoped to the visitor's own, non-closed conversation.
drop policy if exists "chat_messages_public_read" on public.live_chat_messages;
create policy "chat_messages_public_read" on public.live_chat_messages
  for select to anon
  using (
    exists (
      select 1 from public.live_chat_conversations c
      where c.id = conversation_id
        and c.visitor_token::text = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'chat_token', '')
    )
  );

drop policy if exists "chat_messages_public_insert" on public.live_chat_messages;
create policy "chat_messages_public_insert" on public.live_chat_messages
  for insert to anon
  with check (
    exists (
      select 1 from public.live_chat_conversations c
      where c.id = conversation_id
        and c.visitor_token::text = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'chat_token', '')
        and c.status <> 'closed'
    )
  );
