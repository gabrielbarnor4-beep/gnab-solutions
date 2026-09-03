-- ============================================================
-- GNAB 017 — Footer visibility toggle
-- Adds show_in_footer to content that may appear in footer.
-- Admin controls via checkbox; footer reads only flagged rows.
-- ============================================================

-- Services
alter table public.services add column if not exists show_in_footer boolean not null default false;
create index if not exists idx_services_footer on public.services (show_in_footer) where show_in_footer is true;

-- Seed: mark the 6 services currently hard-coded in Footer as visible
update public.services set show_in_footer = true where name in (
  'Office Stationery & Consumables',
  'IT Equipment & Accessories',
  'Cleaning & Janitorial Supplies',
  'PPE & Safety Equipment',
  'PPE & Safety',
  'Office Furniture',
  'Printing & Branding'
) and show_in_footer = false;

-- Products (optional — if you later surface featured products in footer)
alter table public.products add column if not exists show_in_footer boolean not null default false;
create index if not exists idx_products_footer on public.products (show_in_footer) where show_in_footer is true;

-- Industries (for potential footer column)
alter table public.industries add column if not exists show_in_footer boolean not null default false;
create index if not exists idx_industries_footer on public.industries (show_in_footer) where show_in_footer is true;

-- Blog posts (for footer highlights)
alter table public.blog_posts add column if not exists show_in_footer boolean not null default false;
create index if not exists idx_blog_footer on public.blog_posts (show_in_footer) where show_in_footer is true;

-- Why choose us / process steps — also toggleable for footer highlights if desired
alter table public.why_choose_us add column if not exists show_in_footer boolean not null default false;
alter table public.process_steps add column if not exists show_in_footer boolean not null default false;
