-- ============================================================
-- GNAB 024 — COT (Call to Action) per other pages + hero highlight
-- Makes every other page's COT use same premium design as Home COT
-- and hero headings share same text design (3xl/5xl extrabold + gold highlight)
-- All editable via Admin → Site Pages
-- ============================================================

insert into public.site_settings (key, value) values
  -- About hero highlight split (so hero title can have gold highlight like COT)
  ('about_hero_title_highlight', 'Seamless Procurement'),

  -- Services COT
  ('services_cta_eyebrow', 'Custom sourcing'),
  ('services_cta_title', 'Need Something Specific?'),
  ('services_cta_subtitle', 'We handle custom procurement requests for unique business needs — just ask.'),
  ('services_cta_primary_label', 'Request a Custom Quote'),
  ('services_cta_secondary_label', 'Explore Products'),

  -- Industries COT
  ('industries_cta_eyebrow', 'Your industry'),
  ('industries_cta_title', 'Don''t See Your Sector?'),
  ('industries_cta_subtitle', 'We serve organisations of every type and size across Ghana. Tell us what you need.'),
  ('industries_cta_primary_label', 'Request a Quote'),
  ('industries_cta_secondary_label', 'Contact Our Team'),

  -- Products COT
  ('products_cta_eyebrow', 'Custom sourcing'),
  ('products_cta_title', 'Can''t Find What You Need?'),
  ('products_cta_subtitle', 'Our sourcing team tracks down anything your business requires — locally or internationally.'),
  ('products_cta_primary_label', 'Request Custom Sourcing'),
  ('products_cta_secondary_label', 'Browse Services'),

  -- Process COT
  ('process_cta_eyebrow', 'Start today'),
  ('process_cta_title', 'Ready to Start Step One?'),
  ('process_cta_subtitle', 'Tell us what you need — get a transparent quotation within 24 hours.'),
  ('process_cta_primary_label', 'Request a Quote'),
  ('process_cta_secondary_label', 'Talk to Our Team'),

  -- WhyUs COT
  ('whyus_cta_eyebrow', 'Why GNAB'),
  ('whyus_cta_title', 'Experience the GNAB Difference'),
  ('whyus_cta_subtitle', 'Join the organisations across Ghana already procuring smarter.'),
  ('whyus_cta_primary_label', 'Request a Quote Today'),
  ('whyus_cta_secondary_label', 'Talk to Our Team'),

  -- Industries hero highlight
  ('industries_hero_title_highlight', 'Every Sector'),
  -- Products hero highlight
  ('products_hero_title_highlight', 'Your Business Needs'),
  -- Process hero highlight
  ('process_hero_title_highlight', 'Clarity'),
  -- WhyUs hero highlight
  ('whyus_hero_title_highlight', 'Strategic Partner'),
  -- Services hero highlight
  ('services_hero_title_highlight', 'Every Need'),
  -- Contact hero highlight
  ('contact_hero_title_highlight', 'Conversation'),
  -- Quote hero highlight
  ('quote_hero_title_highlight', 'Free Quotation'),
  -- Supplier hero highlight
  ('supplier_hero_title_highlight', 'GNAB Supplier'),
  -- Testimonials hero highlight
  ('testimonials_hero_title_highlight', 'GNAB'),
  -- Blog hero highlight
  ('blog_hero_title_highlight', 'Procurement Forward')

on conflict (key) do nothing;
