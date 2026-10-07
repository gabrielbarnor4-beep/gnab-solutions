-- ============================================================
-- GNAB — 038 Agro & Foodstuffs
-- Adds the 11th service catalogue (farm produce sourced as
-- intermediary between vetted farmers/suppliers and customers,
-- delivered anywhere in Ghana or worldwide).
-- Mirrors 032/034 exactly. Idempotent: safe to re-run.
-- Run after 001→037 in Supabase SQL Editor.
-- ============================================================

-- 1. Product category (display_order 10; shift the tail after it)
insert into public.product_categories (name, display_order) values
  ('Agro & Foodstuffs', 10)
on conflict (name) do nothing;

update public.product_categories set display_order = 11 where name = 'General Office Consumables';
update public.product_categories set display_order = 12 where name = 'Custom Sourcing';

-- 2. Service row (published + in footer so it mirrors the site immediately;
--    admin can edit, unpublish, or remove it from the footer anytime)
insert into public.services (name, category, short_description, full_description, image_url, published, display_order, show_in_footer)
select
  'Agro & Foodstuffs',
  'Agro & Foodstuffs',
  'Yam, maize, cocoa, fruits and vegetables — sourced from vetted farmers and delivered in Ghana or worldwide.',
  'Whether you are stocking a kitchen, a school, a hotel or an export container — we act as your intermediary between vetted farmers and your table. We source yam, maize, cocoa, rice, cassava, plantain, fresh vegetables, fruits, beans, oils and spices, verify quality at the farm gate and deliver anywhere in Ghana or worldwide with proper packing and documentation.',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop',
  true, 10, true
where not exists (select 1 from public.services where name = 'Agro & Foodstuffs');

update public.services
set image_url = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop'
where name = 'Agro & Foodstuffs' and image_url is null;

-- keep display order stable: agro sits before custom sourcing
update public.services set display_order = 10 where name = 'Agro & Foodstuffs';
update public.services set display_order = 11 where name in ('Custom Procurement & Sourcing', 'Custom Sourcing');

-- 3. Products (12) — only insert missing names so re-runs are safe
insert into public.products (name, category, short_description, status, display_order, featured)
select v.name, v.category, v.short_description, 'active', v.display_order, false
from (values
  ('Yam (Pona & Varieties)', 'Agro & Foodstuffs', 'Pona, water yam and white yam in bulk bags, export-grade selection.', 121),
  ('Maize & Corn', 'Agro & Foodstuffs', 'White and yellow maize, dried and bagged by the maxi-bag or tonne.', 122),
  ('Cocoa Beans', 'Agro & Foodstuffs', 'Fermented, dried and graded cocoa beans for local and export buyers.', 123),
  ('Rice (Local & Imported)', 'Agro & Foodstuffs', 'Perfumed and non-perfumed rice, bagged 5kg–50kg.', 124),
  ('Cassava, Gari & Flours', 'Agro & Foodstuffs', 'Fresh cassava, kokonte, gari, cassava dough and banku mix.', 125),
  ('Plantain & Cocoyam', 'Agro & Foodstuffs', 'Fresh bunches and sacks, farm-gate sourced and sorted.', 126),
  ('Fresh Vegetables', 'Agro & Foodstuffs', 'Tomatoes, onions, peppers, okra, garden eggs and leafy greens.', 127),
  ('Fresh Fruits', 'Agro & Foodstuffs', 'Mango, pineapple, banana, orange, avocado, coconut and more in season.', 128),
  ('Beans, Grains & Nuts', 'Agro & Foodstuffs', 'Soya beans, cowpea (black-eyed peas), groundnuts and millet.', 129),
  ('Palm Oil & Cooking Oils', 'Agro & Foodstuffs', 'Pure palm oil, coconut oil and vegetable oils in bulk drums.', 130),
  ('Spices & Seasonings', 'Agro & Foodstuffs', 'Ginger, turmeric, dawadawa, prekese, grains of selim and blends.', 131),
  ('Export Packing & Cold-Chain Delivery', 'Agro & Foodstuffs', 'Grading, packing, documentation and delivery in Ghana or abroad.', 132)
) as v(name, category, short_description, display_order)
where not exists (select 1 from public.products p where p.name = v.name);
