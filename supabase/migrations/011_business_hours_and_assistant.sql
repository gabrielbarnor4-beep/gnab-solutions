-- ============================================================
-- GNAB 011 — Business hours editable + Assistant Q&A pipeline
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Business hours (editable in Admin → Settings → Location & Map)
insert into public.site_settings (key, value) values
  ('hours_weekday', '8:00 – 17:00'),
  ('hours_saturday', 'Closed'),
  ('hours_sunday', 'Closed')
on conflict (key) do nothing;

-- Assistant unanswered questions → admin answers → future precise replies
create table if not exists public.assistant_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  status text not null default 'pending' check (status in ('pending','answered','published','rejected')),
  asked_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table public.assistant_questions enable row level security;

-- Public widget may log a question (only as pending, cannot self-publish)
drop policy if exists "public_submit_question" on public.assistant_questions;
create policy "public_submit_question"
on public.assistant_questions for insert
with check (status = 'pending');

-- Public may read published Q&A (so assistant can fetch them)
drop policy if exists "public_read_published_faq" on public.assistant_questions;
create policy "public_read_published_faq"
on public.assistant_questions for select
using (status = 'published' and answer is not null);

-- Admins can read all (pending included) and manage
drop policy if exists "admin_read_questions" on public.assistant_questions;
create policy "admin_read_questions"
on public.assistant_questions for select
using (public.is_admin());

drop policy if exists "admin_update_questions" on public.assistant_questions;
create policy "admin_update_questions"
on public.assistant_questions for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_delete_questions" on public.assistant_questions;
create policy "admin_delete_questions"
on public.assistant_questions for delete
using (public.is_admin());

-- Keep updated_at fresh
drop trigger if exists trg_assistant_questions_updated_at on public.assistant_questions;
create trigger trg_assistant_questions_updated_at
before update on public.assistant_questions
for each row execute function public.set_updated_at();

-- Stamp answered_at when an answer is first provided
create or replace function public.set_answered_at()
returns trigger
language plpgsql
as $$
begin
  if new.answer is not null and new.answer <> '' and (old.answer is null or old.answer = '') then
    new.answered_at := now();
    if new.status = 'pending' then
      new.status := 'answered';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_answered_at on public.assistant_questions;
create trigger trg_set_answered_at
before update on public.assistant_questions
for each row execute function public.set_answered_at();

-- 30-day retention for rejected questions (like testimonials)
alter table public.assistant_questions add column if not exists deleted_at timestamptz;
create index if not exists idx_assistant_q_deleted_at on public.assistant_questions (deleted_at);

-- Extend the nightly purge to include this table (recreate job)
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
    $cron$
  );
end $migration$;
