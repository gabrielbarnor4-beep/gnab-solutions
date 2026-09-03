-- ============================================================
-- GNAB 019 — Header contact strip per-item visibility
-- Allows admin to edit what shows on header top bar and
-- toggle each item individually.
-- ============================================================

insert into public.site_settings (key, value) values
  ('header_show_phone', 'true'),
  ('header_show_email', 'true'),
  ('header_show_tagline', 'true')
on conflict (key) do nothing;
