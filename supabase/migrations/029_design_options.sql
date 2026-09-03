-- ============================================================
-- GNAB 029 — Heading design system (premium options, admin-driven)
-- Home hero + inner heroes + CTA cards + footer headings share one
-- gold-family design language, controlled from Admin with no rebuild.
-- All keys are read via useSiteSettings() with hardcoded fallbacks,
-- so this migration is safe to re-run (idempotent).
-- ============================================================

insert into public.site_settings (key, value) values
  -- Home hero heading design
  ('home_hero_eyebrow_style', 'pill'),
  ('home_hero_title_size', 'standard'),
  ('home_hero_align', 'left'),
  -- Inner page heroes (global for all pages)
  ('page_hero_eyebrow_style', 'pill'),
  ('page_hero_align', 'center'),
  ('page_hero_title_size', 'standard'),
  -- CTA cards (Home "Ready to Simplify Your Procurement?" design everywhere)
  ('cta_eyebrow_style', 'pill'),
  ('cta_align', 'center'),
  ('cta_title_size', 'standard'),
  ('cta_theme', 'navy-gold'),
  -- Per-page CTA gold highlights (tail rendered in gold gradient)
  ('about_cta_title_highlight', 'With Us Today'),
  ('services_cta_title_highlight', 'Something Specific?'),
  ('industries_cta_title_highlight', 'Your Sector?'),
  ('products_cta_title_highlight', 'What You Need?'),
  ('process_cta_title_highlight', 'Step One?'),
  ('whyus_cta_title_highlight', 'GNAB Difference'),
  -- Footer column headings (same gold family as COT headings)
  ('footer_quick_links_title', 'Quick Links'),
  ('footer_services_title', 'Services'),
  ('footer_contact_title', 'Contact'),
  ('footer_heading_style', 'gold-bar')
on conflict (key) do nothing;
