-- ============================================================
-- GNAB 023 — Other Pages CMS (About, Services, Industries,
-- Products, Process, Why Us, Contact, Quote, Supplier, etc.)
-- Makes every hard-coded hero/section/card text editable via
-- site_settings so Admin -> Pages can mirror public site.
-- ============================================================

insert into public.site_settings (key, value) values
  -- About
  ('about_hero_title', 'The Partner Behind Seamless Procurement'),
  ('about_hero_subtitle', 'Ghana''s trusted partner for corporate procurement, sourcing and supply — delivering measurable value to businesses, government, NGOs and institutions.'),
  ('about_story_eyebrow', 'Our Story'),
  ('about_story_title', 'Built on Trust, Driven by Results'),
  ('about_story_p1', 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.'),
  ('about_story_p2', 'We serve businesses, government institutions, NGOs, schools, hospitals, hotels and SMEs across Ghana with reliable, efficient and cost-effective procurement solutions.'),
  ('about_pillars', '[{"value":"100+","label":"Trusted Suppliers"},{"value":"500+","label":"Products Sourced"},{"value":"24h","label":"Quote Turnaround"},{"value":"100%","label":"Commitment"}]'),
  ('about_mission_title', 'Our Mission'),
  ('about_mission_desc', 'To simplify procurement through reliable sourcing, competitive pricing and timely delivery.'),
  ('about_vision_title', 'Our Vision'),
  ('about_vision_desc', 'To become Ghana''s most trusted procurement and supply partner.'),
  ('about_values_eyebrow', 'What Guides Us'),
  ('about_values_title', 'Our Core Values'),
  ('about_values_subtitle', 'Four principles that shape every partnership and every delivery.'),
  ('about_values_cards', '[{"title":"Integrity","desc":"We conduct business with uncompromising ethical standards."},{"title":"Customer Focus","desc":"Your success drives every decision we make."},{"title":"Excellence","desc":"We pursue excellence in every detail of every order."},{"title":"Innovation","desc":"We embrace smarter ways to simplify procurement."}]'),
  ('about_cta_eyebrow', 'Partner with us'),
  ('about_cta_title', 'Partner With Us Today'),
  ('about_cta_subtitle', 'Experience the GNAB difference in procurement and supply solutions.'),
  ('about_cta_primary_label', 'Get Started'),
  ('about_cta_secondary_label', 'Become a Supplier'),

  -- Services
  ('services_hero_title', 'Procurement Solutions for Every Need'),
  ('services_hero_subtitle', 'From everyday office essentials to fully custom sourcing — one partner, endless solutions.'),
  ('services_section_eyebrow', 'What We Offer'),
  ('services_section_title', 'Explore Our Service Catalogues'),
  ('services_section_subtitle', 'Click any service to browse its full product catalogue.'),

  -- Industries
  ('industries_hero_title', 'Trusted Across Every Sector'),
  ('industries_hero_subtitle', 'From government ministries to growing startups — we understand the unique procurement needs of each industry.'),

  -- Products
  ('products_hero_title', 'Everything Your Business Needs'),
  ('products_hero_subtitle', 'Browse our curated catalogue — request a quote on any item and receive pricing within 24 hours.'),
  ('products_search_placeholder', 'Search products...'),
  ('products_empty_title', 'No products match your search'),
  ('products_empty_desc', 'Try a different keyword — or ask us directly. If it exists, we can source it.'),

  -- Process
  ('process_hero_title', 'A Procurement Process Built on Clarity'),
  ('process_hero_subtitle', 'Six transparent steps from your first request to lasting after-sales support.'),
  ('process_guarantee', '[{"value":"24 Hours","label":"Quotation turnaround"},{"value":"100%","label":"Order accuracy commitment"},{"value":"Dedicated","label":"Account manager support"}]'),

  -- Why Us
  ('whyus_hero_title', 'More Than a Supplier — A Strategic Partner'),
  ('whyus_hero_subtitle', 'Organisations across Ghana choose GNAB because we treat procurement as a partnership, not a transaction.'),
  ('whyus_comparison_typical_title', 'Typical Procurement'),
  ('whyus_comparison_typical_bullets', '["Multiple vendors to chase","Inconsistent pricing","Slow, unclear quotations","No accountability after delivery"]'),
  ('whyus_comparison_gnab_title', 'The GNAB Way'),
  ('whyus_comparison_gnab_bullets', '["One partner for everything","Transparent, competitive pricing","Quotation within 24 hours","After-sales support that stays"]'),

  -- Contact
  ('contact_hero_title', 'Let''s Start a Conversation'),
  ('contact_hero_subtitle', 'Questions, requests or partnerships — our team responds within hours, not days.'),
  ('contact_get_in_touch_title', 'Get in Touch'),
  ('contact_get_in_touch_desc', 'Choose the channel that suits you best.'),
  ('contact_form_title', 'Send Us a Message'),
  ('contact_form_subtitle', 'We typically reply within a few hours.'),
  ('contact_form_success_title', 'Message Sent Successfully'),
  ('contact_form_success_desc', 'Thank you for contacting GNAB Business Solutions. We will respond as soon as possible.'),

  -- Quote
  ('quote_hero_title', 'Get Your Free Quotation'),
  ('quote_hero_subtitle', 'Tell us what you need — receive a competitive, transparent quotation within 24 hours.'),
  ('quote_how_it_works_title', 'How It Works'),
  ('quote_form_title', 'Your Request Details'),

  -- Supplier
  ('supplier_hero_title', 'Become a GNAB Supplier'),
  ('supplier_hero_subtitle', 'Join our trusted network of suppliers and gain access to procurement opportunities across Ghana.'),
  ('supplier_intro_desc', 'Tell us about your business and the products or services you supply. Applications are reviewed within five working days.'),

  -- Testimonials/Blog
  ('testimonials_hero_title', 'What Organisations Say About GNAB'),
  ('testimonials_hero_subtitle', 'Real feedback from the businesses and institutions we serve across Ghana.'),
  ('testimonials_share_title', 'Share Your Experience'),
  ('blog_hero_title', 'Insights That Move Procurement Forward'),
  ('blog_hero_subtitle', 'Guides, trends and company news for organisations that buy smarter.')
on conflict (key) do nothing;
