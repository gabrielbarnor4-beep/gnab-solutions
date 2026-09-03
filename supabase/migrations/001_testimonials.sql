-- ============================================================
-- GNAB Business Solutions — Testimonials
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text,
  company text,
  rating int not null default 5 check (rating between 1 and 5),
  quote text not null,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

alter table public.testimonials enable row level security;

-- Public visitors may read APPROVED testimonials only
create policy "public_read_approved"
on public.testimonials for select
using (status = 'approved');

-- Authenticated admins may read everything (pending included)
create policy "admin_read_all"
on public.testimonials for select
using (auth.role() = 'authenticated');

-- Anyone may submit, but ONLY as pending (cannot self-publish)
create policy "public_submit_pending"
on public.testimonials for insert
with check (status = 'pending');

-- Only authenticated admins may publish / unpublish / edit
create policy "admin_update"
on public.testimonials for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Only authenticated admins may delete
create policy "admin_delete"
on public.testimonials for delete
using (auth.role() = 'authenticated');
