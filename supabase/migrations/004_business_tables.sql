-- ============================================================
-- GNAB Business Solutions — Business data tables
-- quote_requests (RFQ pipeline) + suppliers (registrations)
-- Public: may submit only. Admins (admin_users): full access.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Quote Requests (RFQ)
-- ------------------------------------------------------------
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  rfq_number text unique not null,
  status text not null default 'new'
    check (status in ('new','under_review','quotation_prepared','quotation_sent','awaiting_customer','won','lost','closed')),
  assigned_to text,
  internal_notes text,
  full_name text not null,
  company_name text,
  email text not null,
  phone text not null,
  whatsapp text,
  industry text,
  product_category text,
  product_item text,
  other_category text,
  other_product text,
  products_or_services text not null,
  quantity text,
  delivery_location text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quote_requests enable row level security;

create policy "public_submit_rfq"
on public.quote_requests for insert
with check (true);

create policy "admin_read_rfq"
on public.quote_requests for select
using (public.is_admin());

create policy "admin_update_rfq"
on public.quote_requests for update
using (public.is_admin())
with check (public.is_admin());

create policy "admin_delete_rfq"
on public.quote_requests for delete
using (public.is_admin());

drop trigger if exists trg_quote_requests_updated_at on public.quote_requests;
create trigger trg_quote_requests_updated_at
before update on public.quote_requests
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Supplier Registrations
-- ------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending','under_review','approved','rejected')),
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  whatsapp text,
  business_address text,
  website text,
  registration_number text,
  tin_number text,
  category text,
  categories_supplied text[] not null default '{}',
  products_services text,
  years_in_business text,
  areas_of_operation text,
  description text,
  additional_info text,
  document_urls text[] not null default '{}',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create policy "public_submit_supplier"
on public.suppliers for insert
with check (status = 'pending');

create policy "admin_read_supplier"
on public.suppliers for select
using (public.is_admin());

create policy "admin_update_supplier"
on public.suppliers for update
using (public.is_admin())
with check (public.is_admin());

create policy "admin_delete_supplier"
on public.suppliers for delete
using (public.is_admin());

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();
