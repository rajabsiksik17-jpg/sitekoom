-- ============================================================================
-- Sitekoom — Email campaigns (admin → clients) + closed-chat protection
-- ============================================================================

create table if not exists public.email_campaigns (
  id               uuid primary key default gen_random_uuid(),
  sender_id        uuid references public.users(id) on delete set null,
  subject          text,
  recipients_count integer not null default 0,
  success_count    integer not null default 0,
  failed_count     integer not null default 0,
  status           text not null default 'sent',
  created_at       timestamptz not null default now()
);
create index if not exists email_campaigns_created_idx on public.email_campaigns (created_at desc);

create table if not exists public.email_campaign_recipients (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete set null,
  recipient   text not null,
  status      text not null default 'sent', -- sent | failed
  error       text,
  sent_at     timestamptz not null default now()
);
create index if not exists ecr_campaign_idx on public.email_campaign_recipients (campaign_id);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;

drop policy if exists "email_campaigns_admin_all" on public.email_campaigns;
create policy "email_campaigns_admin_all" on public.email_campaigns
  for all to authenticated using (public.has_permission('clients.view'))
  with check (public.has_permission('clients.manage'));
drop policy if exists "email_campaign_recipients_admin_all" on public.email_campaign_recipients;
create policy "email_campaign_recipients_admin_all" on public.email_campaign_recipients
  for all to authenticated using (public.has_permission('clients.view'))
  with check (public.has_permission('clients.manage'));

-- ---------------------------------------------------------------------------
-- Reject any message inserted into a closed live-chat conversation
-- (applies to both anon visitors and admins, regardless of frontend state).
-- ---------------------------------------------------------------------------
create or replace function public.prevent_closed_chat_message()
returns trigger
language plpgsql
security definer
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

drop trigger if exists trg_prevent_closed_chat_message on public.live_chat_messages;
create trigger trg_prevent_closed_chat_message
before insert on public.live_chat_messages
for each row execute procedure public.prevent_closed_chat_message();
