-- ============================================================
-- GNAB 022 — Receipts + Editable PDF Templates
-- Adds receipts (issued after quotation won) and pdf_templates
-- for quotation / message_reply / receipt PDFs
-- ============================================================

-- ------------------------------------------------------------
-- Receipts — issued after quotation won, emailed as PDF
-- ------------------------------------------------------------
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text unique not null,
  quote_request_id uuid references public.quote_requests(id) on delete cascade,
  quotation_id uuid references public.quotations(id) on delete set null,
  customer_name text not null,
  company_name text,
  email text not null,
  phone text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  balance_due numeric not null default 0,
  payment_method text,
  payment_date date,
  status text not null default 'issued' check (status in ('draft','issued','paid','cancelled')),
  pdf_url text,
  notes text,
  terms text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_receipts_request on public.receipts (quote_request_id);
create index if not exists idx_receipts_quotation on public.receipts (quotation_id);
create index if not exists idx_receipts_deleted_at on public.receipts (deleted_at);
create index if not exists idx_receipts_number on public.receipts (receipt_number);

drop trigger if exists trg_receipts_updated_at on public.receipts;
create trigger trg_receipts_updated_at before update on public.receipts for each row execute function public.set_updated_at();

alter table public.receipts enable row level security;
drop policy if exists "admin_all_receipts" on public.receipts;
create policy "admin_all_receipts" on public.receipts for all using (public.is_admin()) with check (public.is_admin());
-- No public insert/select — receipts are admin-issued only

-- ------------------------------------------------------------
-- PDF Templates — editable what appears in each PDF type
-- ------------------------------------------------------------
create table if not exists public.pdf_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('quotation','message_reply','receipt')),
  name text not null,
  is_active boolean not null default true,
  -- Email subject template (supports {{variables}})
  subject_template text not null default '',
  -- PDF content templates
  title_template text not null default '',
  subtitle_template text,
  header_company_name text not null default 'GNAB Business Solutions',
  header_tagline text not null default 'One Partner. Endless Solutions.',
  header_contact text not null default 'gnabsolutions@gmail.com  •  +233 55 427 3445  •  Accra, Ghana',
  header_logo_url text not null default 'https://i.imgur.com/FTPqfBS.png',
  primary_color text not null default '#0B2E59',
  accent_color text not null default '#D4AF37',
  body_template text,
  table_head jsonb not null default '[]'::jsonb,
  totals_template jsonb not null default '[]'::jsonb,
  terms_template text,
  footer_text text not null default 'GNAB Business Solutions  •  One Partner. Endless Solutions.  •  Simplifying procurement for organisations across Ghana and Beyond.',
  footer_note text not null default 'This document was generated electronically and is valid without signature.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(type, is_active) -- only one active per type (partial index below enforces correctly)
);

-- Enforce only one active per type (partial unique index)
create unique index if not exists idx_pdf_templates_one_active on public.pdf_templates (type) where is_active = true;

drop trigger if exists trg_pdf_templates_updated_at on public.pdf_templates;
create trigger trg_pdf_templates_updated_at before update on public.pdf_templates for each row execute function public.set_updated_at();

alter table public.pdf_templates enable row level security;
drop policy if exists "public_read_pdf_templates" on public.pdf_templates;
create policy "public_read_pdf_templates" on public.pdf_templates for select using (is_active = true);
drop policy if exists "admin_all_pdf_templates" on public.pdf_templates;
create policy "admin_all_pdf_templates" on public.pdf_templates for all using (public.is_admin()) with check (public.is_admin());

-- Seed default templates (idempotent — only if not exists)
insert into public.pdf_templates (type, name, subject_template, title_template, subtitle_template, body_template, table_head, totals_template, terms_template, is_active)
values
  ('quotation', 'Default Quotation', 'Your GNAB Quotation {{quotation_number}} — {{rfq_number}}', 'Quotation {{quotation_number}}', 'In response to {{rfq_number}} — {{products_preview}}', null, '["Description","Qty","Unit Price (GHS)","Total (GHS)"]'::jsonb, '["Subtotal","Total Amount"]'::jsonb, 'Prices valid for 14 days. Delivery as per quotation. Payment terms: 50% advance, 50% on delivery.', true),
  ('message_reply', 'Default Message Reply', 'Re: {{subject}} — GNAB Business Solutions', 'Response to Your Message', 'Re: {{subject}}', '{{admin_reply}}', '[]'::jsonb, '[]'::jsonb, null, true),
  ('receipt', 'Default Receipt', 'Your GNAB Receipt {{receipt_number}} — {{rfq_number}}', 'Receipt {{receipt_number}}', 'Payment received for {{rfq_number}} — {{products_preview}}', null, '["Description","Qty","Unit Price (GHS)","Total (GHS)"]'::jsonb, '["Subtotal","Discount","Tax","Total Amount","Amount Paid","Balance Due"]'::jsonb, 'Thank you for your business. Payment received. This receipt is valid without signature.', true)
on conflict do nothing;

-- Extend purge cron to include receipts + pdf_templates (templates are not purged, but receipts are)
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
      delete from public.receipts where deleted_at < now() - interval '30 days';
    $cron$
  );
end $migration$;
