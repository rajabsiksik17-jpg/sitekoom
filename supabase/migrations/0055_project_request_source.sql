-- Track which work page a project request came from.
alter table public.project_requests
  add column if not exists source_type text,
  add column if not exists source_work_id uuid,
  add column if not exists source_work_title text;
