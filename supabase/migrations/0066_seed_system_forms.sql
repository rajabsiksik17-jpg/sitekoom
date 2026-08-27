-- ============================================================================
-- Sitekoom — Seed default system forms (contact / pricing / chat / offer)
-- ============================================================================

insert into public.dynamic_forms (key, placement, title_ar, title_en, description_ar, description_en, success_message_ar, success_message_en, is_active, sort) values
  ('contact','contact','نموذج التواصل','Contact Form',null,null,'تم استلام رسالتك بنجاح','Your message has been received',true,1),
  ('pricing_request','pricing_request','نموذج طلب التسعير','Pricing Request Form',null,null,'تم استلام طلبك بنجاح','Your request has been received',true,2),
  ('live_chat','live_chat','نموذج بدء المحادثة','Live Chat Form',null,null,null,null,true,3),
  ('offer','offer','نموذج طلب العرض','Offer Request Form',null,null,'تم استلام طلبك بنجاح','Your request has been received',true,4)
on conflict (key) do update set placement = excluded.placement, title_ar = excluded.title_ar, title_en = excluded.title_en;

-- Helper to seed a field for a form.
create or replace function public.__seed_form_field(fkey text, fkey_field text, ftype text, label_ar text, label_en text, ph_ar text, ph_en text, req boolean, sort int) returns void language plpgsql as $$
begin
  insert into public.dynamic_form_fields (form_id, field_key, type, label_ar, label_en, placeholder_ar, placeholder_en, required, width, sort)
  values ((select id from public.dynamic_forms where public.dynamic_forms.key = fkey), fkey_field, ftype, label_ar, label_en, ph_ar, ph_en, req, '100', sort)
  on conflict do nothing;
end $$;

-- Contact form
select public.__seed_form_field('contact','name','text','الاسم','Name','اسمك','Your name',true,1);
select public.__seed_form_field('contact','email','email','البريد الإلكتروني','Email','you@example.com','you@example.com',true,2);
select public.__seed_form_field('contact','phone','phone','الهاتف','Phone',null,null,false,3);
select public.__seed_form_field('contact','message','textarea','الرسالة','Message','اكتب رسالتك...','Write your message...',true,4);

-- Pricing request form
select public.__seed_form_field('pricing_request','name','text','الاسم','Name','اسمك','Your name',true,1);
select public.__seed_form_field('pricing_request','email','email','البريد الإلكتروني','Email','you@example.com','you@example.com',true,2);
select public.__seed_form_field('pricing_request','phone','phone','الهاتف','Phone',null,null,false,3);
select public.__seed_form_field('pricing_request','details','textarea','تفاصيل المشروع','Project details','صف مشروعك...','Describe your project...',true,4);

-- Live chat form (kept minimal; chat starts directly if no fields exist)
select public.__seed_form_field('live_chat','name','text','الاسم','Name','اسمك','Your name',true,1);
select public.__seed_form_field('live_chat','email','email','البريد الإلكتروني','Email','you@example.com','you@example.com',false,2);
select public.__seed_form_field('live_chat','message','textarea','الرسالة','Message','كيف يمكننا مساعدتك؟','How can we help you?',true,3);

-- Offer request form (subject + message; name/email/phone are top-level in the offer UI)
select public.__seed_form_field('offer','subject','subject','الموضوع','Subject','ما موضوع طلبك؟','What is your request about?',false,1);
select public.__seed_form_field('offer','message','textarea','التفاصيل الإضافية','Additional details','أي تفاصيل إضافية...','Any additional details...',false,2);

drop function if exists public.__seed_form_field(text, text, text, text, text, text, text, boolean, int);
