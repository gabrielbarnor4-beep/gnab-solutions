-- ============================================================
-- GNAB 018 — Header top bar toggle + Footer visibility config
-- Adds site_settings keys for header/footer show/hide.
-- Footer Services already uses services.show_in_footer (017).
-- ============================================================

insert into public.site_settings (key, value) values
  ('header_show_top_bar', 'true'),
  ('footer_show_brand', 'true'),
  ('footer_show_quick_links', 'true'),
  ('footer_quick_links', '["/","/about","/services","/industries","/products","/process","/why-us","/blog","/supplier-registration"]'),
  ('footer_show_services', 'true'),
  ('footer_show_contact', 'true'),
  ('footer_show_socials', 'true'),
  ('footer_show_bottom', 'true')
on conflict (key) do nothing;
