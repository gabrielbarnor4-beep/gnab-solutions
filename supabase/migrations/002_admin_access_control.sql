-- ============================================================
-- GNAB Business Solutions — Admin access control
-- Fixes: "admin" policies previously granted EVERY authenticated
-- Supabase user full moderation rights.
--
-- After running:
--   1. Create your admin user (Supabase Dashboard → Authentication → Add user)
--   2. Insert their id:
--      insert into public.admin_users (user_id) values ('<auth.users.id>');
-- ============================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Only admins may see the allow-list itself
create policy "admins_read_allowlist"
on public.admin_users for select
using (user_id = auth.uid());

-- SECURITY DEFINER so the check works inside RLS policies without
-- recursive policy evaluation on admin_users
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
$$;

revoke execute on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admin_read_all" on public.testimonials;
drop policy if exists "admin_update" on public.testimonials;
drop policy if exists "admin_delete" on public.testimonials;

create policy "admin_read_all"
on public.testimonials for select
using (public.is_admin());

create policy "admin_update"
on public.testimonials for update
using (public.is_admin())
with check (public.is_admin());

create policy "admin_delete"
on public.testimonials for delete
using (public.is_admin());
