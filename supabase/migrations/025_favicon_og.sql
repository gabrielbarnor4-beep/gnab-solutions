-- ============================================================
-- GNAB 025 — Favicon & Open Graph image (brand logo by default)
-- Lets admin decide what image appears as favicon / og:image
-- via Admin → Settings (mirrored, upload URL or image)
-- ============================================================

insert into public.site_settings (key, value) values
  ('favicon_url', 'https://i.imgur.com/FTPqfBS.png'),
  ('og_image_url', 'https://i.imgur.com/FTPqfBS.png')
on conflict (key) do nothing;
