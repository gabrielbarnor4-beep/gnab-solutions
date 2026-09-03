-- ============================================================
-- GNAB 016 — Home Page CMS
-- Makes every Home section editable: hero, trust bar,
-- about preview, stats, CTA + feature cards
-- Services/Industries/Why/Process already have their own
-- tables — those are reused as fallbacks.
-- ============================================================

-- ------------------------------------------------------------
-- Hero
-- ------------------------------------------------------------
create table if not exists public.home_hero (
  id uuid primary key default gen_random_uuid(),
  badge text not null default 'Welcome to GNAB Business Solutions',
  title_prefix text not null default 'Your Trusted',
  title_highlight text not null default 'Procurement & Supply',
  title_suffix text not null default 'Partner',
  subtitle text not null default 'We simplify procurement through reliable sourcing, competitive pricing and timely delivery — across Ghana and beyond.',
  primary_label text not null default 'Request a Quote',
  primary_link text not null default '/quote',
  secondary_label text not null default 'Explore Our Services',
  secondary_link text not null default '/services',
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
drop trigger if exists trg_home_hero_updated_at on public.home_hero;
create trigger trg_home_hero_updated_at before update on public.home_hero for each row execute function public.set_updated_at();
alter table public.home_hero enable row level security;
drop policy if exists "public_read_home_hero" on public.home_hero;
create policy "public_read_home_hero" on public.home_hero for select using (published);
drop policy if exists "admin_all_home_hero" on public.home_hero;
create policy "admin_all_home_hero" on public.home_hero for all using (public.is_admin()) with check (public.is_admin());
insert into public.home_hero (badge, title_prefix, title_highlight, title_suffix, subtitle) values
('Welcome to GNAB Business Solutions','Your Trusted','Procurement & Supply','Partner','We simplify procurement through reliable sourcing, competitive pricing and timely delivery — across Ghana and beyond.')
on conflict do nothing;

-- ------------------------------------------------------------
-- Trust bar (feature cards)
-- ------------------------------------------------------------
create table if not exists public.home_trust_items (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'ShieldCheck',
  label text not null,
  display_order int not null default 0,
  published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_home_trust_updated_at on public.home_trust_items;
create trigger trg_home_trust_updated_at before update on public.home_trust_items for each row execute function public.set_updated_at();
alter table public.home_trust_items enable row level security;
drop policy if exists "public_read_home_trust" on public.home_trust_items;
create policy "public_read_home_trust" on public.home_trust_items for select using (published and deleted_at is null);
drop policy if exists "admin_all_home_trust" on public.home_trust_items;
create policy "admin_all_home_trust" on public.home_trust_items for all using (public.is_admin()) with check (public.is_admin());
create index if not exists idx_home_trust_deleted_at on public.home_trust_items (deleted_at);
insert into public.home_trust_items (icon, label, display_order) values
('ShieldCheck','Reliable Procurement',1),
('Wallet','Competitive Pricing',2),
('PackageCheck','Quality Assurance',3),
('Truck','Timely Delivery',4),
('Handshake','Trusted Supplier Network',5)
on conflict do nothing;

-- ------------------------------------------------------------
-- About preview
-- ------------------------------------------------------------
create table if not exists public.home_about (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'About Us',
  title_prefix text not null default 'Who We',
  title_highlight text not null default 'Are',
  paragraph1 text not null default 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.',
  paragraph2 text not null default 'From office stationery to industrial equipment, we handle it all with professionalism and efficiency — so your business never stops running.',
  badge_value text not null default '10+',
  badge_label text not null default 'Years of Excellence',
  phone text not null default '+233 55 427 3445',
  phone_label text not null default 'Speak to our team',
  primary_label text not null default 'Learn More About Us',
  primary_link text not null default '/about',
  image_url text,
  overlay_url text,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
drop trigger if exists trg_home_about_updated_at on public.home_about;
create trigger trg_home_about_updated_at before update on public.home_about for each row execute function public.set_updated_at();
alter table public.home_about enable row level security;
drop policy if exists "public_read_home_about" on public.home_about;
create policy "public_read_home_about" on public.home_about for select using (published);
drop policy if exists "admin_all_home_about" on public.home_about;
create policy "admin_all_home_about" on public.home_about for all using (public.is_admin()) with check (public.is_admin());
insert into public.home_about (eyebrow, title_prefix, title_highlight) values ('About Us','Who We','Are') on conflict do nothing;

-- ------------------------------------------------------------
-- Stats (4)
-- ------------------------------------------------------------
create table if not exists public.home_stats (
  id uuid primary key default gen_random_uuid(),
  value int not null,
  suffix text not null default '',
  label text not null,
  display_order int not null default 0,
  published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_home_stats_updated_at on public.home_stats;
create trigger trg_home_stats_updated_at before update on public.home_stats for each row execute function public.set_updated_at();
alter table public.home_stats enable row level security;
drop policy if exists "public_read_home_stats" on public.home_stats;
create policy "public_read_home_stats" on public.home_stats for select using (published and deleted_at is null);
drop policy if exists "admin_all_home_stats" on public.home_stats;
create policy "admin_all_home_stats" on public.home_stats for all using (public.is_admin()) with check (public.is_admin());
create index if not exists idx_home_stats_deleted_at on public.home_stats (deleted_at);
insert into public.home_stats (value, suffix, label, display_order) values
(100,'+','Supplier Network',1),
(500,'+','Products Available',2),
(24,'h','Quotation Response',3),
(100,'%','Customer Commitment',4)
on conflict do nothing;

-- ------------------------------------------------------------
-- CTA premium card
-- ------------------------------------------------------------
create table if not exists public.home_cta (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'Let''s talk',
  title_prefix text not null default 'Ready to Simplify',
  title_highlight text not null default 'Your Procurement?',
  subtitle text not null default 'Let GNAB handle your sourcing, pricing and delivery — one partner, endless solutions. Your free quotation lands within 24 hours.',
  primary_label text not null default 'Request a Quote',
  primary_link text not null default '/quote',
  secondary_label text not null default 'Contact Our Team',
  secondary_link text not null default '/contact',
  feature1 text not null default '24h response',
  feature2 text not null default '100% commitment',
  feature3 text not null default 'No obligation until you approve',
  bg_image_url text,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
drop trigger if exists trg_home_cta_updated_at on public.home_cta;
create trigger trg_home_cta_updated_at before update on public.home_cta for each row execute function public.set_updated_at();
alter table public.home_cta enable row level security;
drop policy if exists "public_read_home_cta" on public.home_cta;
create policy "public_read_home_cta" on public.home_cta for select using (published);
drop policy if exists "admin_all_home_cta" on public.home_cta;
create policy "admin_all_home_cta" on public.home_cta for all using (public.is_admin()) with check (public.is_admin());
insert into public.home_cta (eyebrow, title_prefix, title_highlight) values ('Let''s talk','Ready to Simplify','Your Procurement?') on conflict do nothing;

-- ------------------------------------------------------------
-- Purge for new tables
-- ------------------------------------------------------------
create index if not exists idx_home_hero_updated on public.home_hero (updated_at);
create index if not exists idx_home_about_updated on public.home_about (updated_at);
create index if not exists idx_home_cta_updated on public.home_cta (updated_at);
