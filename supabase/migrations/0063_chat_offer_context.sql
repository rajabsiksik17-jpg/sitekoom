-- ============================================================================
-- Sitekoom — Live chat offer context
-- ============================================================================
alter table public.live_chat_conversations
  add column if not exists offer_id uuid references public.offers(id) on delete set null,
  add column if not exists offer_title text;
create index if not exists chat_offer_idx on public.live_chat_conversations (offer_id);
