-- ============================================================
-- GNAB 012 — Business Locations (multiple) for interactive map
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  google_maps_url text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_locations_active on public.locations (is_active);
create index if not exists idx_locations_deleted_at on public.locations (deleted_at);
create index if not exists idx_locations_sort on public.locations (sort_order);

drop trigger if exists trg_locations_updated_at on public.locations;
create trigger trg_locations_updated_at before update on public.locations for each row execute function public.set_updated_at();

alter table public.locations enable row level security;

drop policy if exists "public_read_locations" on public.locations;
create policy "public_read_locations" on public.locations for select using (is_active and deleted_at is null);

drop policy if exists "admin_all_locations" on public.locations;
create policy "admin_all_locations" on public.locations for all using (public.is_admin()) with check (public.is_admin());

-- Seed from current site_settings address if no locations yet (so map isn't empty after upgrade)
do $$
declare
  addr text;
  has_rows boolean;
begin
  select exists (select 1 from public.locations where deleted_at is null) into has_rows;
  if not has_rows then
    select value into addr from public.site_settings where key = 'address' limit 1;
    if addr is not null and addr <> '' then
      insert into public.locations (name, address, latitude, longitude, is_primary, sort_order, is_active)
      values ('Head Office', addr, 5.6037, -0.1870, true, 0, true);
    end if;
  end if;
end $$;

-- Extend nightly purge to include locations (recreate job)
create extension if not exists pg_cron;
do $migration$
begin
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
      delete from public.assistant_questions where deleted_at < now() - interval '30 days';
      delete from public.assistant_questions where status = 'rejected' and updated_at < now() - interval '30 days';
      delete from public.locations where deleted_at < now() - interval '30 days';
    $cron$
  );
end $migration$;
