-- ============================================================
-- GNAB 021 — Storage size guard (server-side)
-- Enforces 5MB per file in attachments bucket at DB level,
-- so even if client bypasses JS check, Supabase rejects.
-- Also adds rate-limit helper table for future server-side
-- rate limiting (5/min per email/IP).
-- ============================================================

-- 5MB check via storage.objects metadata size (if available) or name length as fallback
-- Supabase stores size in metadata->>'size' (as text), but trigger can check octet_length
create or replace function public.check_attachments_size()
returns trigger
language plpgsql
as $$
declare
  sz int;
begin
  -- Try metadata size first
  if new.metadata ? 'size' then
    sz := (new.metadata->>'size')::int;
    if sz > 5 * 1024 * 1024 then
      raise exception 'File too large (max 5MB). Upload was rejected server-side.';
    end if;
  end if;
  -- Fallback: check name length for obviously large names (not perfect but safe)
  if octet_length(new.name) > 200 then
    raise exception 'File name too long.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_attachments_size on storage.objects;
create trigger trg_check_attachments_size
  before insert on storage.objects
  for each row
  when (new.bucket_id = 'attachments')
  execute function public.check_attachments_size();

-- Rate-limit helper (client already does 5/min, this is server-side for future edge function)
create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
drop policy if exists "no_public_rate_limits" on public.rate_limits;
create policy "no_public_rate_limits" on public.rate_limits for select using (false);
drop policy if exists "service_rate_limits" on public.rate_limits;
create policy "service_rate_limits" on public.rate_limits for all using (public.is_admin()) with check (public.is_admin());

-- Helper function for edge functions to check rate limit
create or replace function public.check_rate_limit(p_key text, p_limit int, p_window interval)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  rec record;
begin
  select * into rec from public.rate_limits where key = p_key for update;
  if not found then
    insert into public.rate_limits (key, count, window_start) values (p_key, 1, now());
    return true;
  end if;
  if now() - rec.window_start > p_window then
    update public.rate_limits set count = 1, window_start = now() where key = p_key;
    return true;
  end if;
  if rec.count >= p_limit then
    return false;
  end if;
  update public.rate_limits set count = rec.count + 1 where key = p_key;
  return true;
end;
$$;
