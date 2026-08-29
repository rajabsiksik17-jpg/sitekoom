-- ============================================================================
-- Sitekoom — Appointment dynamic form (managed via the existing Form Builder)
-- ============================================================================
insert into public.dynamic_forms (key, placement, title_ar, title_en, description_ar, description_en, success_message_ar, success_message_en, is_active, sort)
values
  ('appointment', 'appointment', 'نموذج حجز موعد', 'Appointment Form', null, null,
   'تم استلام طلب حجزك وسيؤكد فريقنا الموعد قريبًا.', 'Your appointment request has been received. We will confirm shortly.',
   true, 5)
on conflict (key) do update set placement = excluded.placement;

do $$
declare fid uuid;
begin
  select id into fid from public.dynamic_forms where key = 'appointment';
  if not exists (select 1 from public.dynamic_form_fields where form_id = fid) then
    insert into public.dynamic_form_fields (form_id, field_key, type, label_ar, label_en, placeholder_ar, placeholder_en, required, width, sort) values
      (fid, 'name',    'text',     'الاسم الكامل',      'Full name',       'اسمك الكامل',      'Your full name',      true,  '100', 1),
      (fid, 'email',   'email',    'البريد الإلكتروني', 'Email',           'you@example.com',  'you@example.com',     true,  '100', 2),
      (fid, 'phone',   'phone',    'رقم الهاتف',        'Phone',           null,               null,                  true,  '100', 3),
      (fid, 'subject', 'subject',  'الموضوع',           'Subject',         'ما موضوع موعدك؟',  'What is your appointment about?', true, '100', 4),
      (fid, 'notes',   'textarea', 'ملاحظات إضافية',    'Additional notes', 'أي تفاصيل إضافية', 'Any additional details', false, '100', 5);
  end if;
end $$;
