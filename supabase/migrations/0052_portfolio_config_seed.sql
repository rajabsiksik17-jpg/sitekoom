-- Seed reasonable, editable default portfolio configs for existing services.
-- These are stored in the DB (editable from the admin) — NOT hardcoded rules.

-- Programming services: gallery + video + website + external links + text.
update public.services
set portfolio_config = '["gallery","video","website_url","external_link","text_block"]'::jsonb
where portfolio_config = '[]'::jsonb
  and slug in ('web-development','ecommerce','custom-software','mobile-apps','erp-systems','pos-systems','crm-systems','administrative-systems');

-- Marketing services: gallery + video + external links + social + text.
update public.services
set portfolio_config = '["gallery","video","external_link","social_links","text_block"]'::jsonb
where portfolio_config = '[]'::jsonb
  and category_id = (select id from public.service_categories where slug = 'marketing');
