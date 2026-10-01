-- ============================================================
-- GNAB — 034 IT Solutions & Digital Services
-- Adds the 10th service catalogue (websites designed, built and
-- maintained in-house; ERP/business systems sourced via partners).
-- Mirrors 032/033 exactly. Idempotent: safe to re-run.
-- Run after 001→033 in Supabase SQL Editor.
-- ============================================================

-- 1. Product category (display_order 9; shift the tail after it)
insert into public.product_categories (name, display_order) values
  ('IT Solutions & Digital Services', 9)
on conflict (name) do nothing;

update public.product_categories set display_order = 10 where name = 'General Office Consumables';
update public.product_categories set display_order = 11 where name = 'Custom Sourcing';

-- 2. Service row (published + in footer so it mirrors the site immediately;
--    admin can edit, unpublish, or remove it from the footer anytime)
insert into public.services (name, category, short_description, full_description, image_url, published, display_order, show_in_footer)
select
  'IT Solutions & Digital Services',
  'IT Solutions & Digital Services',
  'Websites we design, build and maintain in-house — plus ERP and business systems sourced through vetted partners.',
  'Your online presence and back-office systems deserve the same single-partner treatment as everything else you procure. We design, build and maintain business websites in-house — and source ERP, CRM and other business systems through vetted specialist partners. Every engagement starts with a scoping call, follows with a written proposal, and ends with training and a care or support plan, all with transparent pricing.',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop',
  true, 9, true
where not exists (select 1 from public.services where name = 'IT Solutions & Digital Services');

update public.services
set image_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop'
where name = 'IT Solutions & Digital Services' and image_url is null;

-- keep display order stable: IT solutions sits before custom sourcing
update public.services set display_order = 9 where name = 'IT Solutions & Digital Services';
update public.services set display_order = 10 where name in ('Custom Procurement & Sourcing', 'Custom Sourcing');

-- 3. Products (12) — only insert missing names so re-runs are safe
insert into public.products (name, category, short_description, status, display_order, featured)
select v.name, v.category, v.short_description, 'active', v.display_order, false
from (values
  ('Business Website Design', 'IT Solutions & Digital Services', 'Modern, mobile-first designs matched to your brand and goals.', 109),
  ('Website Development', 'IT Solutions & Digital Services', 'Custom builds — corporate sites, portals and e-commerce stores.', 110),
  ('Website Maintenance & Care Plans', 'IT Solutions & Digital Services', 'Updates, backups, security monitoring and monthly retainers.', 111),
  ('E-Commerce Stores', 'IT Solutions & Digital Services', 'Product catalogues with MoMo/card payments and order management.', 112),
  ('ERP & Business Systems', 'IT Solutions & Digital Services', 'ERP/CRM selection, setup and rollout for SMEs and institutions.', 113),
  ('Custom Web Applications', 'IT Solutions & Digital Services', 'Dashboards, booking systems and internal business tools.', 114),
  ('UI/UX Design', 'IT Solutions & Digital Services', 'Wireframes, prototypes and usability reviews before build.', 115),
  ('Domain, Hosting & Business Email', 'IT Solutions & Digital Services', 'Registration, hosting setup and Google/Microsoft business email.', 116),
  ('Systems Integration', 'IT Solutions & Digital Services', 'Connecting website, payments, inventory and accounting tools.', 117),
  ('SEO & Analytics Setup', 'IT Solutions & Digital Services', 'Search visibility, Analytics/Search Console and monthly reports.', 118),
  ('Training & Handover', 'IT Solutions & Digital Services', 'Staff training, manuals and full admin handover sessions.', 119),
  ('Priority Support Plans', 'IT Solutions & Digital Services', 'SLA-based support for the sites and systems we deliver.', 120)
) as v(name, category, short_description, display_order)
where not exists (select 1 from public.products p where p.name = v.name);
