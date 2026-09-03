-- ============================================================
-- GNAB Business Solutions — Rejected testimonials: 30-day grace period
-- Rejections become soft-deletes: status = 'rejected' + rejected_at.
-- A daily pg_cron job permanently purges rejections older than 30 days,
-- giving admins one month to reconsider ("restore") them.
-- ============================================================

alter table public.testimonials
  drop constraint if exists testimonials_status_check;

alter table public.testimonials
  add constraint testimonials_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.testimonials
  add column if not exists rejected_at timestamptz;

-- Stamp/clear rejected_at automatically whenever status changes
create or replace function public.set_rejected_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.rejected_at := now();
  elsif new.status <> 'rejected' then
    new.rejected_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_rejected_at on public.testimonials;
create trigger trg_set_rejected_at
before update on public.testimonials
for each row execute function public.set_rejected_at();

-- Purge rejections past the 30-day window
create extension if not exists pg_cron;

delete from public.testimonials
where status = 'rejected'
  and rejected_at < now() - interval '30 days';

do $retention$
begin
  if not exists (select 1 from cron.job where jobname = 'purge_rejected_testimonials') then
    perform cron.schedule(
      'purge_rejected_testimonials',
      '17 3 * * *',
      $$delete from public.testimonials where status = 'rejected' and rejected_at < now() - interval '30 days'$$
    );
  end if;
end;
$retention$;
