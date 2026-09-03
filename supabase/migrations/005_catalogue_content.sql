-- ============================================================
-- GNAB Business Solutions — Catalogue, content & settings
-- products + categories, services, blog_posts, company_documents,
-- site_settings. Storage buckets: media (images), documents (PDFs).
-- Public reads published/active rows only; admins manage everything.
-- ============================================================

-- ------------------------------------------------------------
-- Product categories
-- ------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_categories enable row level security;

create policy "public_read_categories" on public.product_categories for select using (true);
create policy "admin_all_categories" on public.product_categories for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.product_categories (name, display_order) values
  ('Office Stationery & Consumables', 1),
  ('IT Equipment & Accessories', 2),
  ('Cleaning & Janitorial Supplies', 3),
  ('PPE & Safety', 4),
  ('Office Furniture', 5),
  ('Printing & Branding', 6),
  ('Electrical Materials', 7),
  ('General Office Consumables', 8),
  ('Custom Sourcing', 9)
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  short_description text,
  description text,
  image_url text,
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active','inactive')),
  display_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "public_read_products" on public.products for select using (status = 'active');
create policy "admin_all_products" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Services
-- ------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  short_description text,
  full_description text,
  image_url text,
  published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "public_read_services" on public.services for select using (published);
create policy "admin_all_services" on public.services for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at before update on public.services
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Blog posts
-- ------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  featured_image_url text,
  author text,
  category text not null default 'Company News'
    check (category in ('Company News','Guides','Industry Trends','Procurement Insights','Supplier Updates')),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

create policy "public_read_posts" on public.blog_posts for select using (status = 'published');
create policy "admin_all_posts" on public.blog_posts for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Company documents (Company Profile PDF lifecycle)
-- ------------------------------------------------------------
create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text unique not null,
  file_size bigint,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.company_documents enable row level security;

create policy "public_read_active_document" on public.company_documents for select using (is_active);
create policy "admin_all_documents" on public.company_documents for all
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Site settings (single source of truth, safe fallbacks in app code)
-- ------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "public_read_settings" on public.site_settings for select using (true);
create policy "admin_update_settings" on public.site_settings for update
  using (public.is_admin()) with check (public.is_admin());
create policy "admin_insert_settings" on public.site_settings for insert
  with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('company_name', 'GNAB Business Solutions'),
  ('tagline', 'One Partner. Endless Solutions.'),
  ('company_description', 'Ghana''s trusted partner for corporate procurement, sourcing and supply — delivering measurable value to businesses, government, NGOs and institutions.'),
  ('email', 'gnabsolutions@gmail.com'),
  ('phone', '+233 55 427 3445'),
  ('whatsapp', '+233 27 547 3098'),
  ('address', 'Accra Business District, Greater Accra, Ghana'),
  ('logo_url', 'https://i.imgur.com/FTPqfBS.png'),
  ('social_linkedin', ''),
  ('social_facebook', ''),
  ('social_twitter', ''),
  ('social_instagram', ''),
  ('seo_title', 'GNAB Business Solutions | One Partner. Endless Solutions.'),
  ('seo_description', 'Ghana''s trusted partner for corporate procurement, sourcing and supply — reliable sourcing, competitive pricing, timely delivery.'),
  ('footer_text', 'Simplifying procurement for organisations across Ghana and West Africa.')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- Storage buckets + admin-only write policies
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "admins_select_storage" on storage.objects;
drop policy if exists "admins_upload_media" on storage.objects;
drop policy if exists "admins_update_media" on storage.objects;
drop policy if exists "admins_delete_media" on storage.objects;

create policy "admins_select_storage" on storage.objects for select to authenticated
  using (bucket_id in ('media','documents') and public.is_admin());

create policy "admins_upload_media" on storage.objects for insert to authenticated
  with check (bucket_id in ('media','documents') and public.is_admin());

create policy "admins_update_media" on storage.objects for update to authenticated
  using (bucket_id in ('media','documents') and public.is_admin())
  with check (bucket_id in ('media','documents') and public.is_admin());

create policy "admins_delete_media" on storage.objects for delete to authenticated
  using (bucket_id in ('media','documents') and public.is_admin());
