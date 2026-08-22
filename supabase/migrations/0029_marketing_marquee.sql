-- Add a marketing message to the homepage marquee (Technology + Marketing).
insert into public.marquee_messages (id, text_ar, text_en, is_active, sort) values
  ('90000000-0000-0000-0000-000000000004',
   'نبني حضورك الرقمي، ونحوّل حضورك إلى نتائج — تقنية وإبداع وتسويق في حل واحد',
   'We build your digital presence and turn it into results — technology, creativity and marketing in one solution',
   true, 4)
on conflict (id) do update set
  text_ar = excluded.text_ar,
  text_en = excluded.text_en,
  is_active = excluded.is_active,
  sort = excluded.sort;
