-- ============================================================
-- GNAB 007 — Full CMS (industries, why_choose_us, process_steps)
-- + 30-day soft-delete retention for EVERY deletable entity
-- + seeds for services/products so admin reflects live site
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. New CMS tables (industries, why_choose_us, process_steps)
-- ------------------------------------------------------------

create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text not null default '',
  icon text not null default 'Building2',
  display_order int not null default 0,
  published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.why_choose_us (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'Handshake',
  display_order int not null default 0,
  published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  step_number text not null,
  title text not null,
  description text not null default '',
  points text[] not null default '{}',
  image_url text,
  display_order int not null default 0,
  published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at triggers
drop trigger if exists trg_industries_updated_at on public.industries;
create trigger trg_industries_updated_at before update on public.industries for each row execute function public.set_updated_at();
drop trigger if exists trg_why_updated_at on public.why_choose_us;
create trigger trg_why_updated_at before update on public.why_choose_us for each row execute function public.set_updated_at();
drop trigger if exists trg_process_updated_at on public.process_steps;
create trigger trg_process_updated_at before update on public.process_steps for each row execute function public.set_updated_at();

-- RLS
alter table public.industries enable row level security;
alter table public.why_choose_us enable row level security;
alter table public.process_steps enable row level security;

drop policy if exists "public_read_industries" on public.industries;
create policy "public_read_industries" on public.industries for select using (published and deleted_at is null);
drop policy if exists "admin_all_industries" on public.industries;
create policy "admin_all_industries" on public.industries for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_why" on public.why_choose_us;
create policy "public_read_why" on public.why_choose_us for select using (published and deleted_at is null);
drop policy if exists "admin_all_why" on public.why_choose_us;
create policy "admin_all_why" on public.why_choose_us for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_process" on public.process_steps;
create policy "public_read_process" on public.process_steps for select using (published and deleted_at is null);
drop policy if exists "admin_all_process" on public.process_steps;
create policy "admin_all_process" on public.process_steps for all using (public.is_admin()) with check (public.is_admin());

-- Seed industries (8)
insert into public.industries (name, description, icon, display_order, published) values
  ('Corporate Organisations', 'End-to-end procurement support for enterprises — from daily consumables to full office setups, handled with corporate-grade reliability.', 'Building2', 1, true),
  ('Government & Public Sector', 'Transparent, compliant procurement for ministries, agencies and public institutions, with documentation you can trust.', 'Globe2', 2, true),
  ('Schools & Universities', 'Stationery, lab supplies, furniture and IT equipment that keep institutions running — on budget, on schedule.', 'GraduationCap', 3, true),
  ('Hospitals & Healthcare', 'Reliable supply of medical consumables, hygiene products and operational equipment for healthcare facilities.', 'HeartPulse', 4, true),
  ('Hotels & Hospitality', 'Guest amenities, kitchen supplies, cleaning solutions and branding materials for premium hospitality experiences.', 'Hotel', 5, true),
  ('Construction Companies', 'PPE, electrical materials, tools and site supplies delivered where and when your project needs them.', 'HardHat', 6, true),
  ('NGOs & Development', 'Cost-effective, accountable procurement for non-profit programmes and development projects across Ghana.', 'Handshake', 7, true),
  ('SMEs', 'Big-business sourcing power for small and medium enterprises — flexible quantities, fair prices, no hassle.', 'Store', 8, true)
on conflict (name) do nothing;

-- Seed why_choose_us (6)
insert into public.why_choose_us (title, description, icon, display_order, published) values
  ('Reliable Supplier Network', 'One call should be enough — and with us, it is. Our network of over 100 verified suppliers across Ghana means whatever you need, we already know where to get it.', 'Handshake', 1, true),
  ('Fast Delivery', 'Procurement only counts when goods arrive. Standard items delivered within 2–5 working days nationwide, with proactive status updates.', 'Truck', 2, true),
  ('Competitive Pricing', 'Bulk purchasing power passed directly to you. Transparent quotations with no hidden fees, negotiated across multiple suppliers.', 'Wallet', 3, true),
  ('Professional Support', 'A dedicated account manager who owns your file end-to-end — quotations within 24 hours, same-day answers.', 'Headphones', 4, true),
  ('Quality Assurance', 'Supplier certifications verified before contracts, goods inspected before dispatch. If anything falls short we replace it.', 'ShieldCheck', 5, true),
  ('Tailored Solutions', 'Custom procurement packages shaped around your operations, budget cycles and compliance needs — if it exists, we will find it.', 'Sparkles', 6, true)
on conflict do nothing;

-- Seed process_steps (6)
insert into public.process_steps (step_number, title, description, points, display_order, published) values
  ('01', 'Receive Request', 'Your enquiry opens the file. Reach us via quote form, phone, email or WhatsApp — a dedicated officer takes it from there.', array['Requirements captured in full: specs, quantities, brands and deadline','Receipt confirmed within hours','Urgent requests flagged for same-day sourcing'], 1, true),
  ('02', 'Source Products', 'We put your requirement to work across 100+ vetted suppliers — locally and internationally — comparing options you would spend days finding.', array['Multiple suppliers queried on quality, availability and price','Genuine products only — every source is verified','Smarter alternatives suggested where they add value'], 2, true),
  ('03', 'Prepare Quotation', 'Within 24 hours a clear written quotation lands with you — built to be understood by you, finance and auditors.', array['Fully itemised pricing — no hidden fees','Exact specifications and delivery timeline','Clear validity period'], 3, true),
  ('04', 'Client Approval', 'The decision stays yours. Review at your pace while we remain on hand to adjust anything.', array['Questions answered and specs fine-tuned','Revised quotes issued quickly','Nothing ordered until you give the go-ahead'], 4, true),
  ('05', 'Delivery', 'Approval triggers immediate dispatch. Logistics coordinates warehouse to doorstep anywhere in Ghana.', array['Prompt dispatch with tracking','Nationwide 2–5 working days','Orders verified complete at every handover'], 5, true),
  ('06', 'After-Sales Support', 'Delivery ends the order, not the relationship. Your account manager stays available.', array['Warranty claims and replacements handled','Priority re-order reminders','Periodic account reviews'], 6, true)
on conflict do nothing;

-- ------------------------------------------------------------
-- 2. Add deleted_at to existing tables for 30-day retention
-- ------------------------------------------------------------
alter table public.products add column if not exists deleted_at timestamptz;
alter table public.product_categories add column if not exists deleted_at timestamptz;
alter table public.services add column if not exists deleted_at timestamptz;
alter table public.blog_posts add column if not exists deleted_at timestamptz;
alter table public.company_documents add column if not exists deleted_at timestamptz;
alter table public.testimonials add column if not exists deleted_at timestamptz;
alter table public.suppliers add column if not exists deleted_at timestamptz;
alter table public.quote_requests add column if not exists deleted_at timestamptz;

create index if not exists idx_products_deleted_at on public.products (deleted_at);
create index if not exists idx_categories_deleted_at on public.product_categories (deleted_at);
create index if not exists idx_services_deleted_at on public.services (deleted_at);
create index if not exists idx_blog_deleted_at on public.blog_posts (deleted_at);
create index if not exists idx_docs_deleted_at on public.company_documents (deleted_at);
create index if not exists idx_testimonials_deleted_at on public.testimonials (deleted_at);
create index if not exists idx_suppliers_deleted_at on public.suppliers (deleted_at);
create index if not exists idx_quotes_deleted_at on public.quote_requests (deleted_at);
create index if not exists idx_industries_deleted_at on public.industries (deleted_at);
create index if not exists idx_why_deleted_at on public.why_choose_us (deleted_at);
create index if not exists idx_process_deleted_at on public.process_steps (deleted_at);

-- Update public read policies to hide soft-deleted rows
-- products
drop policy if exists "public_read_products" on public.products;
create policy "public_read_products" on public.products for select using (status = 'active' and deleted_at is null);
-- product_categories
drop policy if exists "public_read_categories" on public.product_categories;
create policy "public_read_categories" on public.product_categories for select using (deleted_at is null);
-- services
drop policy if exists "public_read_services" on public.services;
create policy "public_read_services" on public.services for select using (published and deleted_at is null);
-- blog_posts
drop policy if exists "public_read_posts" on public.blog_posts;
create policy "public_read_posts" on public.blog_posts for select using (status = 'published' and deleted_at is null);
-- company_documents
drop policy if exists "public_read_active_document" on public.company_documents;
create policy "public_read_active_document" on public.company_documents for select using (is_active and deleted_at is null);
-- testimonials: approved and not deleted (rejected is already handled separately)
drop policy if exists "public_read_approved" on public.testimonials;
create policy "public_read_approved" on public.testimonials for select using (status = 'approved' and deleted_at is null);
-- suppliers / quote_requests: no public read beyond insert, but hide deleted for admin reads via filter in app

-- ------------------------------------------------------------
-- 3. Seed services (8) so admin Services page reflects live site
-- ------------------------------------------------------------
insert into public.services (name, category, short_description, full_description, published, display_order) values
  ('Office Stationery & Consumables', 'Office Stationery & Consumables', 'Everything an office consumes daily — sourced in bulk from trusted brands.', 'Your office runs on the small things. We supply a complete range on scheduled or on-demand delivery, consolidating dozens of suppliers into one reliable account. Every item is genuine, branded stock at wholesale-competitive pricing.', true, 1),
  ('IT Equipment & Accessories', 'IT Equipment & Accessories', 'Work-ready technology from trusted global brands — specified and warrantied.', 'Technology purchases are long-term decisions — we make them safe ones. We specify, source and deliver business-grade IT matched to your workload and budget, with manufacturer warranties and optional setup.', true, 2),
  ('Cleaning & Janitorial Supplies', 'Cleaning & Janitorial Supplies', 'Professional hygiene supplies that keep spaces spotless and safe.', 'A clean environment protects health and reputation. We keep facilities supplied with professional janitorial products — from daily consumables to commercial machines — with standing orders.', true, 3),
  ('PPE & Safety Equipment', 'PPE & Safety', 'Certified PPE that meets international standards — protecting your people is non-negotiable.', 'Protecting your people is a legal and moral obligation. All our PPE meets recognised standards, with certification docs available. We supply construction, factories, hospitals, schools and labs.', true, 4),
  ('Office Furniture', 'Office Furniture', 'Ergonomic, durable furniture — delivered and assembled anywhere in Ghana.', 'The right furniture changes how people work. We supply and install ergonomic office furniture — from a single desk to full floor fit-outs — including planning, delivery and assembly.', true, 5),
  ('Printing & Branding', 'Printing & Branding', 'Corporate printing and branding that puts your identity on everything.', 'Your brand deserves consistency. Our printing desk handles everything from stationery to large-format campaigns — working to your brand guidelines with proofs approved before production.', true, 6),
  ('Electrical Materials', 'Electrical Materials', 'Certified electrical supplies for fit-outs and construction — quality that passes inspection.', 'Electrical work leaves no room for substandard components. We supply certified cables, fittings, lighting and power equipment with specs upfront and bulk pricing.', true, 7),
  ('Custom Procurement & Sourcing', 'Custom Sourcing', 'If it exists, we can source it — local and international networks.', 'Not every need fits a category — and "no" is not in our vocabulary. Tell us the spec, quantity and deadline, and our team taps local and international suppliers until it is found.', true, 8)
on conflict do nothing;

-- ------------------------------------------------------------
-- 4. Seed products from catalogue (96) — makes admin Products reflect live site
--    Insert only if products table is still almost empty (<10 rows)
-- ------------------------------------------------------------
do $$
begin
  if (select count(*) from public.products) < 10 then
    insert into public.products (name, category, short_description, status, display_order, featured) values
  ('A4 Copy Paper', 'Office Stationery & Consumables', '70–80gsm premium multipurpose reams, boxed in fives.', 'active', 1, false),
  ('Ballpoint Pens', 'Office Stationery & Consumables', 'Blue, black and red; smooth-flow boxes of 50.', 'active', 2, false),
  ('Permanent Markers', 'Office Stationery & Consumables', 'Chisel and bullet tip, assorted colours.', 'active', 3, false),
  ('Whiteboard Markers', 'Office Stationery & Consumables', 'Low-odour dry-erase, assorted pack.', 'active', 4, false),
  ('Lever-Arch Files', 'Office Stationery & Consumables', 'A4 foolscap, heavy-duty spine, assorted colours.', 'active', 5, false),
  ('Sticky Notes', 'Office Stationery & Consumables', '76×76mm pads in neon and standard shades.', 'active', 6, false),
  ('Stapler & Staples Set', 'Office Stationery & Consumables', 'Heavy-duty desktop stapler with 5,000 staples.', 'active', 7, false),
  ('Envelopes (Peel & Seal)', 'Office Stationery & Consumables', 'DL and C4 sizes, boxes of 500.', 'active', 8, false),
  ('Ink & Toner Cartridges', 'Office Stationery & Consumables', 'Genuine and compatible HP, Canon, Epson, Brother.', 'active', 9, false),
  ('Spiral Notebooks', 'Office Stationery & Consumables', 'A4 ruled and plain, packs of 10.', 'active', 10, false),
  ('Desk Organisers', 'Office Stationery & Consumables', 'Multi-compartment trays for pens and documents.', 'active', 11, false),
  ('Sticky Tape & Dispensers', 'Office Stationery & Consumables', 'Clear tape rolls with weighted desktop dispensers.', 'active', 12, false),
  ('Business Laptops', 'IT Equipment & Accessories', 'Core i5/i7 business-grade machines from HP, Dell, Lenovo.', 'active', 13, false),
  ('Desktop Computers', 'IT Equipment & Accessories', 'Tower and all-in-one setups for office workstations.', 'active', 14, false),
  ('Monitors', 'IT Equipment & Accessories', '21"–27" Full HD and QHD displays with adjustable stands.', 'active', 15, false),
  ('Printers', 'IT Equipment & Accessories', 'Laserjet, inkjet and multifunction units for any volume.', 'active', 16, false),
  ('Scanners', 'IT Equipment & Accessories', 'Flatbed and document-feed scanners with OCR software.', 'active', 17, false),
  ('Projectors', 'IT Equipment & Accessories', 'Boardroom projectors with ceiling-mount options.', 'active', 18, false),
  ('Networking Equipment', 'IT Equipment & Accessories', 'Routers, switches, access points and patch panels.', 'active', 19, false),
  ('Keyboards & Mice', 'IT Equipment & Accessories', 'Wired and wireless sets, ergonomic options available.', 'active', 20, false),
  ('External Storage', 'IT Equipment & Accessories', 'Portable SSDs and HDDs from 500GB to 4TB.', 'active', 21, false),
  ('UPS Units', 'IT Equipment & Accessories', 'Line-interactive backup power from 650VA to 3kVA.', 'active', 22, false),
  ('Webcams & Headsets', 'IT Equipment & Accessories', 'HD conferencing peripherals for hybrid teams.', 'active', 23, false),
  ('Cables & Adapters', 'IT Equipment & Accessories', 'HDMI, USB-C, VGA, Ethernet and power accessories.', 'active', 24, false),
  ('Disinfectants & Sanitisers', 'Cleaning & Janitorial Supplies', 'Surface disinfectants and hand sanitisers in bulk.', 'active', 25, false),
  ('Mops, Buckets & Wringer Sets', 'Cleaning & Janitorial Supplies', 'Industrial-grade microfibre systems.', 'active', 26, false),
  ('Brooms & Brush Sets', 'Cleaning & Janitorial Supplies', 'Hard and soft bristle sets with handles.', 'active', 27, false),
  ('Waste Bins & Liners', 'Cleaning & Janitorial Supplies', 'Pedal bins, colour-coded liners, outdoor bins.', 'active', 28, false),
  ('Toilet Paper (Bulk)', 'Cleaning & Janitorial Supplies', 'Jumbo rolls and standard rolls by the carton.', 'active', 29, false),
  ('Hand Soap & Dispensers', 'Cleaning & Janitorial Supplies', 'Foam and liquid soap with refillable dispensers.', 'active', 30, false),
  ('Floor Cleaners', 'Cleaning & Janitorial Supplies', 'Concentrated solutions for tile, marble and wood.', 'active', 31, false),
  ('Glass & Multi-Surface Sprays', 'Cleaning & Janitorial Supplies', 'Streak-free cleaners for daily use.', 'active', 32, false),
  ('Vacuum Cleaners', 'Cleaning & Janitorial Supplies', 'Commercial upright and backpack vacuums.', 'active', 33, false),
  ('Air Fresheners', 'Cleaning & Janitorial Supplies', 'Automatic dispensers with refill cartridges.', 'active', 34, false),
  ('Microfibre Cloths', 'Cleaning & Janitorial Supplies', 'Lint-free cloths in bulk packs.', 'active', 35, false),
  ('Laundry & Dish Detergents', 'Cleaning & Janitorial Supplies', 'Machine detergents for staff areas and lodgings.', 'active', 36, false),
  ('Safety Helmets', 'PPE & Safety Equipment', 'EN-certified hard hats in multiple colours.', 'active', 37, false),
  ('Safety Boots', 'PPE & Safety Equipment', 'Steel-toe, slip-resistant boots all sizes.', 'active', 38, false),
  ('Work Gloves', 'PPE & Safety Equipment', 'Cut-resistant, chemical and general-purpose gloves.', 'active', 39, false),
  ('Safety Goggles', 'PPE & Safety Equipment', 'Anti-fog, impact-rated eye protection.', 'active', 40, false),
  ('High-Visibility Vests', 'PPE & Safety Equipment', 'Reflective vests with company branding option.', 'active', 41, false),
  ('Ear Protection', 'PPE & Safety Equipment', 'Earplugs and earmuffs, NRR-rated.', 'active', 42, false),
  ('Respiratory Masks', 'PPE & Safety Equipment', 'N95/FFP2 respirators and half-mask respirators.', 'active', 43, false),
  ('Coveralls', 'PPE & Safety Equipment', 'Disposable and reusable protective suits.', 'active', 44, false),
  ('Safety Harnesses', 'PPE & Safety Equipment', 'Full-body fall-arrest harnesses with lanyards.', 'active', 45, false),
  ('First Aid Kits', 'PPE & Safety Equipment', 'Workplace-compliant kits in wall-mount cases.', 'active', 46, false),
  ('Face Shields', 'PPE & Safety Equipment', 'Full-face protection for grinding and lab work.', 'active', 47, false),
  ('Reflective Traffic Cones', 'PPE & Safety Equipment', 'Site cones and retractable belt barriers.', 'active', 48, false),
  ('Executive Desks', 'Office Furniture', 'Premium L-shaped and straight desks in wood finishes.', 'active', 49, false),
  ('Ergonomic Office Chairs', 'Office Furniture', 'Adjustable lumbar support, mesh and leather options.', 'active', 50, false),
  ('Staff Workstations', 'Office Furniture', 'Modular clusters for teams of 2–8 with dividers.', 'active', 51, false),
  ('Filing Cabinets', 'Office Furniture', '2–4 drawer steel cabinets with locking bars.', 'active', 52, false),
  ('Meeting Room Tables', 'Office Furniture', 'Boardroom tables seating 6–20 with cable ports.', 'active', 53, false),
  ('Reception Counters', 'Office Furniture', 'Custom-branded front-desk units.', 'active', 54, false),
  ('Bookshelves & Credenzas', 'Office Furniture', 'Open shelving and storage sideboards.', 'active', 55, false),
  ('Visitor & Lounge Sofas', 'Office Furniture', 'Reception seating in fabric or leather.', 'active', 56, false),
  ('Partition Screens', 'Office Furniture', 'Freestanding acoustic desk dividers.', 'active', 57, false),
  ('Storage Cabinets', 'Office Furniture', 'Tambour and swing-door steel storage.', 'active', 58, false),
  ('Conference Chairs', 'Office Furniture', 'Stackable and fixed meeting-room seating.', 'active', 59, false),
  ('Height-Adjustable Desks', 'Office Furniture', 'Sit-stand electric desks for modern offices.', 'active', 60, false),
  ('Business Cards', 'Printing & Branding', 'Premium card stock, matte or gloss lamination.', 'active', 61, false),
  ('Letterheads & Envelopes', 'Printing & Branding', 'Branded corporate stationery suites.', 'active', 62, false),
  ('Brochures & Flyers', 'Printing & Branding', 'Bi-fold, tri-fold and flyer runs in full colour.', 'active', 63, false),
  ('Banners & Billboards', 'Printing & Branding', 'Outdoor PVC banners and flex-face billboards.', 'active', 64, false),
  ('Branded Corporate Gifts', 'Printing & Branding', 'Mugs, pens, diaries and hampers with your logo.', 'active', 65, false),
  ('Corporate Apparel', 'Printing & Branding', 'Embroidered and printed polo shirts, overalls, tees.', 'active', 66, false),
  ('Signage', 'Printing & Branding', '3D office signs, directional signage and lightboxes.', 'active', 67, false),
  ('Labels & Stickers', 'Printing & Branding', 'Product labels, seals and die-cut stickers.', 'active', 68, false),
  ('Branded Calendars', 'Printing & Branding', 'Wall and desk calendars for client gifting.', 'active', 69, false),
  ('Roll-Up Banners', 'Printing & Branding', 'Portable pull-up stands for events and lobbies.', 'active', 70, false),
  ('Vehicle Branding', 'Printing & Branding', 'Full and partial vehicle wraps and decals.', 'active', 71, false),
  ('Rubber Stamps', 'Printing & Branding', 'Self-inking company and date stamps.', 'active', 72, false),
  ('Cables & Wires', 'Electrical Materials', 'Single-core, armoured and flexible cables by the roll.', 'active', 73, false),
  ('Circuit Breakers', 'Electrical Materials', 'MCBs, RCCBs and distribution breakers.', 'active', 74, false),
  ('LED Bulbs & Tubes', 'Electrical Materials', 'Energy-saving lamps in all fittings and wattages.', 'active', 75, false),
  ('Sockets & Switches', 'Electrical Materials', 'UK-standard switched sockets and dimmers.', 'active', 76, false),
  ('Distribution Boards', 'Electrical Materials', 'Consumer units and panel boards fully equipped.', 'active', 77, false),
  ('Extension Reels & Boards', 'Electrical Materials', 'Industrial extension reels with surge protection.', 'active', 78, false),
  ('Solar Panels & Inverters', 'Electrical Materials', 'Backup solar kits for homes and offices.', 'active', 79, false),
  ('Flood & Security Lights', 'Electrical Materials', 'LED floods with PIR motion sensors.', 'active', 80, false),
  ('Conduits & Trunkings', 'Electrical Materials', 'PVC conduits, trunkings and accessories.', 'active', 81, false),
  ('Generators', 'Electrical Materials', 'Standby generators from 5kVA to 100kVA.', 'active', 82, false),
  ('Street Lights', 'Electrical Materials', 'Solar and mains-powered street lighting poles.', 'active', 83, false),
  ('Electrical Tools', 'Electrical Materials', 'Insulated tool kits, testers and multimeters.', 'active', 84, false),
  ('Branded Water Bottles', 'Custom Procurement & Sourcing', 'Custom stainless bottles for events and staff.', 'active', 85, false),
  ('School Lab Equipment', 'Custom Procurement & Sourcing', 'Science lab kits sourced for private schools.', 'active', 86, false),
  ('Kitchen Appliances', 'Custom Procurement & Sourcing', 'Bulk kettles, microwaves and fridges for staff rooms.', 'active', 87, false),
  ('Office Plants & Décor', 'Custom Procurement & Sourcing', 'Greenery and interior décor sourcing service.', 'active', 88, false),
  ('Promotional Umbrellas', 'Custom Procurement & Sourcing', 'Branded golf umbrellas for campaigns.', 'active', 89, false),
  ('ID Cards & Lanyards', 'Custom Procurement & Sourcing', 'Printed staff IDs with holders and reels.', 'active', 90, false),
  ('Conference Packs', 'Custom Procurement & Sourcing', 'Complete delegate kits for events and workshops.', 'active', 91, false),
  ('Safety Signage', 'Custom Procurement & Sourcing', 'Custom site safety and wayfinding signs.', 'active', 92, false),
  ('Cleaning Contracts Supplies', 'Custom Procurement & Sourcing', 'Monthly consumable bundles for facility managers.', 'active', 93, false),
  ('IT Disposal Bins', 'Custom Procurement & Sourcing', 'Secure e-waste collection solutions.', 'active', 94, false),
  ('Hospitality Amenities', 'Custom Procurement & Sourcing', 'Guest toiletries and room supplies for hotels.', 'active', 95, false),
  ('Anything Else You Need', 'Custom Procurement & Sourcing', 'Send us the specification — consider it sourced.', 'active', 96, false);
  end if;
end $$;

-- ------------------------------------------------------------
-- 5. Cron purges — hard-delete rows soft-deleted >30 days ago
-- ------------------------------------------------------------
create extension if not exists pg_cron;

-- One-time cleanup of already-expired soft-deletes
delete from public.products where deleted_at < now() - interval '30 days';
delete from public.product_categories where deleted_at < now() - interval '30 days';
delete from public.services where deleted_at < now() - interval '30 days';
delete from public.industries where deleted_at < now() - interval '30 days';
delete from public.why_choose_us where deleted_at < now() - interval '30 days';
delete from public.process_steps where deleted_at < now() - interval '30 days';
delete from public.blog_posts where deleted_at < now() - interval '30 days';
delete from public.company_documents where deleted_at < now() - interval '30 days';
delete from public.testimonials where deleted_at < now() - interval '30 days';
delete from public.suppliers where deleted_at < now() - interval '30 days';
delete from public.quote_requests where deleted_at < now() - interval '30 days';

do $migration$
begin
  if not exists (select 1 from cron.job where jobname = 'purge_soft_deleted_30d') then
    perform cron.schedule(
      'purge_soft_deleted_30d',
      '22 3 * * *',
      $cron$
        delete from public.products where deleted_at < now() - interval '30 days';
        delete from public.product_categories where deleted_at < now() - interval '30 days';
        delete from public.services where deleted_at < now() - interval '30 days';
        delete from public.industries where deleted_at < now() - interval '30 days';
        delete from public.why_choose_us where deleted_at < now() - interval '30 days';
        delete from public.process_steps where deleted_at < now() - interval '30 days';
        delete from public.blog_posts where deleted_at < now() - interval '30 days';
        delete from public.company_documents where deleted_at < now() - interval '30 days';
        delete from public.testimonials where deleted_at < now() - interval '30 days';
        delete from public.suppliers where deleted_at < now() - interval '30 days';
        delete from public.quote_requests where deleted_at < now() - interval '30 days';
      $cron$
    );
  end if;
end $migration$;
