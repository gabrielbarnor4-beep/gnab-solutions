-- ============================================================
-- GNAB — 032 Automobile Services & Spares
-- Adds the 9th service catalogue so Admin mirrors the site.
-- Idempotent: safe to re-run (on conflict / where not exists).
-- Run after 001→031 in Supabase SQL Editor.
-- ============================================================

-- 1. Product category
insert into public.product_categories (name, display_order) values
  ('Automobile Services & Spares', 8)
on conflict (name) do nothing;

-- push Custom Sourcing / General Office Consumables after it for stable ordering
update public.product_categories set display_order = 9 where name = 'General Office Consumables';
update public.product_categories set display_order = 10 where name = 'Custom Sourcing';

-- 2. Service row (published, mirrors ServicesPage automobile-services meta)
insert into public.services (name, category, short_description, full_description, image_url, published, display_order) values
  ('Automobile Services & Spares', 'Automobile Services & Spares',
   'Vehicles, genuine parts, accessories and servicing — for fleets and individuals.',
   'Your fleet and vehicles are business-critical — we keep them running. We source brand-new and quality pre-owned vehicles, genuine spare parts and accessories, and coordinate scheduled servicing for single cars or full fleets. Every vehicle is inspected, documented and delivered road-ready with transparent pricing.',
   'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop',
   true, 8)
on conflict do nothing;

-- fill image only when admin has not set a custom one
update public.services
set image_url = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop'
where name = 'Automobile Services & Spares' and image_url is null;

-- keep display order stable: automobile sits before custom sourcing
update public.services set display_order = 8 where name = 'Automobile Services & Spares';
update public.services set display_order = 9 where name = 'Custom Procurement & Sourcing';

-- 3. Products (12) — only insert missing names so re-runs are safe
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
