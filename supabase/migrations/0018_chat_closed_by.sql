-- ============================================================================
-- Sitekoom — Live chat closed_by tracking
-- ============================================================================

alter table public.live_chat_conversations add column if not exists closed_by text;
