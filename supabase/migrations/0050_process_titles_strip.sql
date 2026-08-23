-- Strip the duplicated "N. " prefix from process step titles. The step number
-- is already rendered inside the numbered circle in the UI.
update public.service_features
set title_ar = regexp_replace(title_ar, '^[0-9]+[\.\)\-]?\s*', ''),
    title_en = regexp_replace(title_en, '^[0-9]+[\.\)\-]?\s*', '')
where kind = 'process'
  and (title_ar ~ '^[0-9]' or title_en ~ '^[0-9]');
