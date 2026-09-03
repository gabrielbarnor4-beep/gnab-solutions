-- ============================================================
-- GNAB 009 — Seed Media Library so every current site image
-- appears in /admin/media for instant replace/add.
-- Idempotent — safe to re-run.
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Helpers: only insert if that exact section+url not already present
-- Home hero carousel (3 images rotate)
insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'home_hero', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2400&auto=format&fit=crop', 'Business professionals in procurement meeting', 0, true
where not exists (select 1 from public.site_images where section='home_hero' and url='https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2400&auto=format&fit=crop');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'home_hero', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop', 'Corporate team discussing logistics', 1, true
where not exists (select 1 from public.site_images where section='home_hero' and url='https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'home_hero', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2400&auto=format&fit=crop', 'Business professionals collaborating', 2, true
where not exists (select 1 from public.site_images where section='home_hero' and url='https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2400&auto=format&fit=crop');

-- Home about
insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'home_about', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop', 'GNAB team at work', 0, true
where not exists (select 1 from public.site_images where section='home_about');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'home_about_overlay', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop', 'Warehouse logistics', 0, true
where not exists (select 1 from public.site_images where section='home_about_overlay');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'home_cta', 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1600&auto=format&fit=crop', 'Logistics and delivery', 0, true
where not exists (select 1 from public.site_images where section='home_cta');

-- About page
insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'about_hero', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop', 'Business analysis', 0, true
where not exists (select 1 from public.site_images where section='about_hero');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'about_warehouse', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop', 'GNAB logistics operations', 0, true
where not exists (select 1 from public.site_images where section='about_warehouse');

-- Per-page heroes
insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'services_hero', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop', 'Services hero', 0, true
where not exists (select 1 from public.site_images where section='services_hero');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'industries_hero', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2400&auto=format&fit=crop', 'Industries hero', 0, true
where not exists (select 1 from public.site_images where section='industries_hero');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'why_hero', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2400&auto=format&fit=crop', 'Why us hero', 0, true
where not exists (select 1 from public.site_images where section='why_hero');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'process_hero', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop', 'Process hero', 0, true
where not exists (select 1 from public.site_images where section='process_hero');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'contact_hero', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop', 'Contact hero', 0, true
where not exists (select 1 from public.site_images where section='contact_hero');

insert into public.site_images (section, url, alt_text, sort_order, is_active)
select 'blog_hero', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop', 'Blog hero', 0, true
where not exists (select 1 from public.site_images where section='blog_hero');

-- Backfill service images (so Services page category cards are editable via Services admin)
update public.services set image_url = 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=1200&auto=format&fit=crop' where name = 'Office Stationery & Consumables' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=1200&auto=format&fit=crop' where name = 'IT Equipment & Accessories' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop' where name = 'Cleaning & Janitorial Supplies' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop' where name = 'PPE & Safety Equipment' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop' where name = 'Office Furniture' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1562408590-e32931084e23?q=80&w=1200&auto=format&fit=crop' where name = 'Printing & Branding' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop' where name = 'Electrical Materials' and image_url is null;
update public.services set image_url = 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800&auto=format&fit=crop' where name = 'Custom Procurement & Sourcing' and image_url is null;

-- Backfill Why Choose Us card images (so each card image is editable via Why Us admin)
update public.why_choose_us set image_url = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop' where title = 'Reliable Supplier Network' and image_url is null;
update public.why_choose_us set image_url = 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1600&auto=format&fit=crop' where title = 'Fast Delivery' and image_url is null;
update public.why_choose_us set image_url = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop' where title = 'Competitive Pricing' and image_url is null;
update public.why_choose_us set image_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop' where title = 'Professional Support' and image_url is null;
update public.why_choose_us set image_url = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop' where title = 'Quality Assurance' and image_url is null;
update public.why_choose_us set image_url = 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop' where title = 'Tailored Solutions' and image_url is null;

-- Backfill Process Step images (so each step image is editable via Process admin)
update public.process_steps set image_url = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop' where step_number = '01' and image_url is null;
update public.process_steps set image_url = 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800&auto=format&fit=crop' where step_number = '02' and image_url is null;
update public.process_steps set image_url = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop' where step_number = '03' and image_url is null;
update public.process_steps set image_url = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop' where step_number = '04' and image_url is null;
update public.process_steps set image_url = 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop' where step_number = '05' and image_url is null;
update public.process_steps set image_url = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop' where step_number = '06' and image_url is null;
