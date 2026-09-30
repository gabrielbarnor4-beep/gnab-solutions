-- ============================================================
-- GNAB — 033 Footer toggles + automobile backfill
-- 1. Guarantees Automobile service/category exist even if 032
--    was never run on this database (the reported "missing
--    automobile in Home/Quote/Admin" root cause).
-- 2. Adds footer_contact_items setting (managed contact column
--    with per-item toggles + ordering).
-- 3. Repairs footer_quick_links default so Reviews (/testimonials),
--    Contact (/contact) and Become a Supplier are present.
-- Idempotent: safe to re-run.
-- ============================================================

-- 1a. Product category (same as 032, harmless if already there)
insert into public.product_categories (name, display_order) values
  ('Automobile Services & Spares', 8)
on conflict (name) do nothing;
update public.product_categories set display_order = 9 where name = 'General Office Consumables';
update public.product_categories set display_order = 10 where name = 'Custom Sourcing';

-- 1b. Service row
insert into public.services (name, category, short_description, full_description, image_url, published, display_order, show_in_footer)
select
  'Automobile Services & Spares',
  'Automobile Services & Spares',
  'Vehicles, genuine parts, accessories and servicing — for fleets and individuals.',
  'Your fleet and vehicles are business-critical — we keep them running. We source brand-new and quality pre-owned vehicles, genuine spare parts and accessories, and coordinate scheduled servicing for single cars or full fleets. Every vehicle is inspected, documented and delivered road-ready with transparent pricing.',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop',
  true, 8, true
where not exists (select 1 from public.services where name = 'Automobile Services & Spares');

update public.services
set image_url = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop'
where name = 'Automobile Services & Spares' and image_url is null;

-- visible in footer by default (admin can toggle off)
update public.services set show_in_footer = true where name = 'Automobile Services & Spares';
-- electrical was never seeded visible (017) — make it visible too so footer isn't stuck at 6
update public.services set show_in_footer = true where name = 'Electrical Materials' and show_in_footer = false;
-- stable ordering: automobile before custom sourcing
update public.services set display_order = 8 where name = 'Automobile Services & Spares';
update public.services set display_order = 9 where name in ('Custom Procurement & Sourcing', 'Custom Sourcing');

-- 1c. Automobile products (same 12 as 032, insert-missing only)
insert into public.products (name, category, short_description, status, display_order, featured)
select v.name, v.category, v.short_description, 'active', v.display_order, false
from (values
  ('Brand-New Vehicles', 'Automobile Services & Spares', 'Saloon cars, SUVs, pickups and buses sourced from authorised dealers.', 97),
  ('Pre-Owned Vehicles', 'Automobile Services & Spares', 'Inspected used cars with service history and roadworthy certification.', 98),
  ('Genuine Spare Parts', 'Automobile Services & Spares', 'OEM engine, brake, suspension and electrical parts for major brands.', 99),
  ('Tyres & Batteries', 'Automobile Services & Spares', 'All sizes of tyres, alloy wheels, batteries and wheel-alignment support.', 100),
  ('Lubricants & Fluids', 'Automobile Services & Spares', 'Engine oils, coolants, brake and transmission fluids in bulk.', 101),
  ('Vehicle Accessories', 'Automobile Services & Spares', 'Seat covers, floor mats, roof racks, dashcams and security trackers.', 102),
  ('Scheduled Servicing', 'Automobile Services & Spares', 'Routine maintenance plans: oil service, filters, brakes and diagnostics.', 103),
  ('Fleet Supply & Management', 'Automobile Services & Spares', 'Multi-vehicle sourcing, branding, servicing schedules and records.', 104),
  ('Vehicle Branding & Detailing', 'Automobile Services & Spares', 'Wraps, decals, interior detailing and paint protection.', 105),
  ('Emergency & Roadside Kits', 'Automobile Services & Spares', 'Jump starters, jacks, warning triangles, first-aid and tool kits.', 106),
  ('Air-Conditioning Service', 'Automobile Services & Spares', 'AC gas refill, compressor parts and cabin-filter replacement.', 107),
  ('Inspection & Registration Support', 'Automobile Services & Spares', 'Roadworthy, insurance and DVLA documentation assistance.', 108)
) as v(name, category, short_description, display_order)
where not exists (select 1 from public.products p where p.name = v.name);

-- 2. Managed contact-column items (per-item visible toggles + order).
-- Seeded from the legacy email/phone/address settings so nothing changes visually
-- until the admin edits Admin → Footer → Contact column.
insert into public.site_settings (key, value)
select 'footer_contact_items', jsonb_build_array(
  jsonb_build_object('id','email','kind','email','label','Email','value', coalesce((select value from public.site_settings where key='email'), ''),'visible', true),
  jsonb_build_object('id','phone','kind','phone','label','Phone','value', coalesce((select value from public.site_settings where key='phone'), ''),'visible', true),
  jsonb_build_object('id','address','kind','address','label','Address','value', coalesce((select value from public.site_settings where key='address'), ''),'visible', true)
)::text
where not exists (select 1 from public.site_settings where key = 'footer_contact_items');

-- 3. Repair quick-links default: legacy 018 list missed Reviews + Contact.
-- If the stored value is still the exact 018 legacy array, upgrade it in place
-- (preserving order, adding the three missing links as visible). Custom admin
-- edits are never overwritten.
update public.site_settings
set value = '[{"name":"Home","path":"/","visible":true},{"name":"About","path":"/about","visible":true},{"name":"Services","path":"/services","visible":true},{"name":"Industries","path":"/industries","visible":true},{"name":"Products","path":"/products","visible":true},{"name":"Process","path":"/process","visible":true},{"name":"Why Us","path":"/why-us","visible":true},{"name":"Blog","path":"/blog","visible":true},{"name":"Reviews","path":"/testimonials","visible":true},{"name":"Contact","path":"/contact","visible":true},{"name":"Become a Supplier","path":"/supplier-registration","visible":true}]'
where key = 'footer_quick_links'
  and value = '["/","/about","/services","/industries","/products","/process","/why-us","/blog","/supplier-registration"]';
