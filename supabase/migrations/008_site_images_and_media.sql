-- ============================================================
-- GNAB 008 — Site Images / Media Library
-- Lets admins control EVERY image on the public site:
--  upload file OR paste URL, choose where it appears,
--  reorder, enable/disable, trash retained 30 days.
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Allow images per Why-Card (the 6 reasons) to be custom
alter table public.why_choose_us add column if not exists image_url text;

-- 2. Generic site image library — one row per placement
create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  section text not null,               -- e.g. home_hero, home_about, home_about_overlay, home_cta, about_hero, about_warehouse, etc.
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_images_section on public.site_images (section);
create index if not exists idx_site_images_deleted_at on public.site_images (deleted_at);
create index if not exists idx_site_images_sort on public.site_images (sort_order);

drop trigger if exists trg_site_images_updated_at on public.site_images;
create trigger trg_site_images_updated_at before update on public.site_images for each row execute function public.set_updated_at();

alter table public.site_images enable row level security;

drop policy if exists "public_read_site_images" on public.site_images;
create policy "public_read_site_images" on public.site_images for select using (is_active and deleted_at is null);

drop policy if exists "admin_all_site_images" on public.site_images;
create policy "admin_all_site_images" on public.site_images for all using (public.is_admin()) with check (public.is_admin());

-- 3. Extend 30-day purge cron to include site_images (and why_choose_us new column needs no backfill)
-- One-time cleanup for already-expired soft-deletes
delete from public.site_images where deleted_at < now() - interval '30 days';

-- Recreate / update the purge job to include site_images
create extension if not exists pg_cron;

do $migration$
begin
  -- Remove old job if it exists (created in 007) so we can recreate with extra table
  if exists (select 1 from cron.job where jobname = 'purge_soft_deleted_30d') then
    perform cron.unschedule('purge_soft_deleted_30d');
  end if;

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
      delete from public.site_images where deleted_at < now() - interval '30 days';
    $cron$
  );
end $migration$;
