-- ============================================================================
-- Sitekoom — Homepage offers / achievements sections
-- ============================================================================
insert into public.homepage_sections (key, title_ar, title_en, description_ar, description_en, is_active, sort, data) values
  ('offers', 'عروض مميزة', 'Featured Offers', 'عروض أسعار مميزة لحلولنا الرقمية', 'Special pricing on our digital solutions', true, 11, '{"limit": 3, "bg_type": "gradient", "bg_colors": ["#0b0a1a", "#2c036e"], "bg_angle": 135, "bg_overlay_color": "#0b0a1a", "bg_overlay_opacity": 0}'::jsonb),
  ('achievements', 'إنجازاتنا', 'Our Achievements', 'مشاريع وتجارب نفخر بها', 'Projects and experiences we are proud of', true, 12, '{"limit": 6}'::jsonb)
on conflict (key) do nothing;
