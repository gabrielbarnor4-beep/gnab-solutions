-- ============================================================
-- GNAB Business Solutions — First-admin bootstrap + admin management
-- Allows the very first authenticated user to claim admin when
-- admin_users is empty, without needing Dashboard SQL.
-- After one admin exists, only admins can add others.
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- SECURITY DEFINER: can read/insert admin_users even though RLS
-- hides other rows from anon/authenticated.
create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_empty boolean;
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    return false;
  end if;

  -- Already an admin? nothing to do
  if exists (select 1 from public.admin_users where user_id = uid) then
    return true;
  end if;

  select not exists (select 1 from public.admin_users) into is_empty;

  if is_empty then
    insert into public.admin_users (user_id) values (uid)
    on conflict (user_id) do nothing;
    return true;
  end if;

  return false;
end;
$$;

revoke execute on function public.claim_first_admin() from anon, public;
grant execute on function public.claim_first_admin() to authenticated;

-- Let admins manage the allow-list after bootstrap (read is already
-- limited to own row; these use is_admin() so only admins can write)
drop policy if exists "admins_insert_allowlist" on public.admin_users;
create policy "admins_insert_allowlist"
on public.admin_users for insert
with check (public.is_admin() or not exists (select 1 from public.admin_users));

drop policy if exists "admins_delete_allowlist" on public.admin_users;
create policy "admins_delete_allowlist"
on public.admin_users for delete
using (public.is_admin());
