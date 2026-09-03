-- ============================================================
-- GNAB 010 — Industries card image + Google Maps embed URL
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

alter table public.industries add column if not exists image_url text;

-- Google Maps embed URL stored in site_settings (single row per key)
insert into public.site_settings (key, value) values
  ('google_maps_embed_url', '')
on conflict (key) do nothing;

insert into public.site_settings (key, value) values
  ('google_maps_url', '')
on conflict (key) do nothing;
