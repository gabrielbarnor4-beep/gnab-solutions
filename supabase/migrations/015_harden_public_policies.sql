-- ============================================================
-- GNAB 015 — Harden public insert policies (security fix)
-- Prevents anon from setting admin-only columns via public submit
-- Must be applied in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Helpers: force safe defaults on public inserts via triggers
create or replace function public.enforce_quote_request_public()
returns trigger language plpgsql as $$
begin
  -- Force safe defaults even if client sends privileged values
  new.status := 'new';
  new.assigned_to := null;
  new.internal_notes := null;
  -- attachment_urls must be small array if present
  if array_length(new.attachment_urls, 1) is not null and array_length(new.attachment_urls, 1) > 5 then
    raise exception 'Too many attachments (max 5)';
  end if;
  return new;
end; $$;

create or replace function public.enforce_contact_message_public()
returns trigger language plpgsql as $$
begin
  new.status := 'new';
  new.admin_reply := null;
  new.reply_pdf_url := null;
  new.replied_at := null;
  new.deleted_at := null;
  if array_length(new.attachment_urls, 1) is not null and array_length(new.attachment_urls, 1) > 5 then
    raise exception 'Too many attachments (max 5)';
  end if;
  return new;
end; $$;

create or replace function public.enforce_supplier_public()
returns trigger language plpgsql as $$
begin
  new.status := 'pending';
  new.internal_notes := null;
  if array_length(new.document_urls, 1) is not null and array_length(new.document_urls, 1) > 5 then
    raise exception 'Too many documents (max 5)';
  end if;
  if array_length(new.attachment_urls, 1) is not null and array_length(new.attachment_urls, 1) > 5 then
    raise exception 'Too many attachments (max 5)';
  end if;
  return new;
end; $$;

-- Attach triggers (idempotent)
drop trigger if exists trg_enforce_quote_request_public on public.quote_requests;
create trigger trg_enforce_quote_request_public before insert on public.quote_requests for each row execute function public.enforce_quote_request_public();

drop trigger if exists trg_enforce_contact_message_public on public.contact_messages;
create trigger trg_enforce_contact_message_public before insert on public.contact_messages for each row execute function public.enforce_contact_message_public();

drop trigger if exists trg_enforce_supplier_public on public.suppliers;
create trigger trg_enforce_supplier_public before insert on public.suppliers for each row execute function public.enforce_supplier_public();

-- Tighten RLS WITH CHECK (defense in depth — even if trigger disabled)
alter table public.quote_requests enable row level security;
drop policy if exists "public_submit_rfq" on public.quote_requests;
create policy "public_submit_rfq"
  on public.quote_requests for insert
  with check (
    status = 'new'
    and assigned_to is null
    and internal_notes is null
  );

alter table public.contact_messages enable row level security;
drop policy if exists "public_submit_contact" on public.contact_messages;
create policy "public_submit_contact"
  on public.contact_messages for insert
  with check (
    status = 'new'
    and admin_reply is null
    and reply_pdf_url is null
    and replied_at is null
    and deleted_at is null
  );

alter table public.suppliers enable row level security;
drop policy if exists "public_submit_supplier" on public.suppliers;
create policy "public_submit_supplier"
  on public.suppliers for insert
  with check (
    status = 'pending'
    and internal_notes is null
  );

-- Add basic email format checks (optional but cheap)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_email_format') then
    alter table public.quote_requests add constraint quote_requests_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_email_format') then
    alter table public.contact_messages add constraint contact_messages_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'suppliers_email_format') then
    alter table public.suppliers add constraint suppliers_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
end $$;

-- Note: storage.objects anon upload kept but client now limits 5MB + allowlist
-- For stricter server-side size enforcement, add Supabase Storage bucket max size in Dashboard → Storage → attachments → 5 MB
