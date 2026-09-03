-- ============================================================
-- GNAB 030 — Per-page CTA feature strips (like Home's CTA)
-- Home's CTA card has editable feature1/2/3 (home_cta table).
-- Inner pages hardcoded "24h response / 100% commitment /
-- No obligation" — these keys make each page's strip editable
-- via Admin → Site Pages (same tab as its CTA copy).
-- Public reads via useSiteSettings() with hardcoded fallback.
-- Idempotent (on conflict do nothing).
-- ============================================================

insert into public.site_settings (key, value) values
  ('about_cta_feature1', '24h response'),
  ('about_cta_feature2', '100% commitment'),
  ('about_cta_feature3', 'No obligation until you approve'),
  ('services_cta_feature1', '24h response'),
  ('services_cta_feature2', '100% commitment'),
  ('services_cta_feature3', 'No obligation until you approve'),
  ('industries_cta_feature1', '24h response'),
  ('industries_cta_feature2', '100% commitment'),
  ('industries_cta_feature3', 'No obligation until you approve'),
  ('products_cta_feature1', '24h response'),
  ('products_cta_feature2', '100% commitment'),
  ('products_cta_feature3', 'No obligation until you approve'),
  ('process_cta_feature1', '24h response'),
  ('process_cta_feature2', '100% commitment'),
  ('process_cta_feature3', 'No obligation until you approve'),
  ('whyus_cta_feature1', '24h response'),
  ('whyus_cta_feature2', '100% commitment'),
  ('whyus_cta_feature3', 'No obligation until you approve')
on conflict (key) do nothing;
