-- ============================================================
-- GNAB 014 — Contact messages, quotations, attachments
-- Also adds soft-delete 30d for messages and quotations
-- Run in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Contact messages (Send Us a Message form)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  attachment_urls text[] not null default '{}',
  status text not null default 'new' check (status in ('new','replied','closed')),
  admin_reply text,
  reply_pdf_url text,
  replied_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_status on public.contact_messages (status);
create index if not exists idx_contact_messages_deleted_at on public.contact_messages (deleted_at);
drop trigger if exists trg_contact_messages_updated_at on public.contact_messages;
create trigger trg_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

alter table public.contact_messages enable row level security;
drop policy if exists "public_submit_contact" on public.contact_messages;
create policy "public_submit_contact" on public.contact_messages for insert with check (true);
drop policy if exists "admin_all_contact" on public.contact_messages;
create policy "admin_all_contact" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());

-- Quotations prepared by admin in response to quote_requests
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.quote_requests(id) on delete cascade,
  quotation_number text unique not null,
  customer_name text not null,
  company_name text,
  email text not null,
  items jsonb not null default '[]'::jsonb, -- [{description, quantity, unit_price, total}]
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric not null default 0,
  valid_until date,
  terms text,
  notes text,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected')),
  pdf_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quotations_request on public.quotations (quote_request_id);
create index if not exists idx_quotations_deleted_at on public.quotations (deleted_at);
drop trigger if exists trg_quotations_updated_at on public.quotations;
create trigger trg_quotations_updated_at before update on public.quotations for each row execute function public.set_updated_at();

alter table public.quotations enable row level security;
drop policy if exists "admin_all_quotations" on public.quotations;
create policy "admin_all_quotations" on public.quotations for all using (public.is_admin()) with check (public.is_admin());
-- Public cannot read quotations directly; they receive PDF via email

-- Extend attachments to quote_requests and suppliers if not already present
alter table public.quote_requests add column if not exists attachment_urls text[] not null default '{}';
alter table public.suppliers add column if not exists attachment_urls text[] not null default '{}';
alter table public.contact_messages add column if not exists attachment_urls text[] not null default '{}';

-- Storage bucket for public form attachments (no auth required to upload)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true) on conflict (id) do nothing;

drop policy if exists "public_upload_attachments" on storage.objects;
create policy "public_upload_attachments" on storage.objects for insert to anon, authenticated with check (bucket_id = 'attachments');

drop policy if exists "public_read_attachments" on storage.objects;
create policy "public_read_attachments" on storage.objects for select using (bucket_id = 'attachments');

drop policy if exists "admin_delete_attachments" on storage.objects;
create policy "admin_delete_attachments" on storage.objects for delete to authenticated using (bucket_id = 'attachments' and public.is_admin());

-- Extend purge job to include new tables
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
      delete from public.contact_messages where deleted_at < now() - interval '30 days';
      delete from public.quotations where deleted_at < now() - interval '30 days';
    $cron$
  );
end $migration$;
