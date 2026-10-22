-- ============================================================
-- Barnor 025 — Favicon & Open Graph image (brand logo by default)
-- Lets admin decide what image appears as favicon / og:image
-- via Admin → Settings (mirrored, upload URL or image)
-- ============================================================

insert into public.site_settings (key, value) values
  ('favicon_url', '/favicon.svg'),
  ('og_image_url', '/brand/barnor-og.png')
on conflict (key) do nothing;
