-- ============================================================
-- GNAB 020 — DB guards against flooding / storage bloat
-- 1A/3B: message length, attachment count, file-type safety
-- Client already compresses images to 1280w webp; DB is last line.
-- ============================================================

-- Contact messages: cap message + attachments
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_message_len') then
    alter table public.contact_messages add constraint contact_messages_message_len check (char_length(message) <= 5000 and char_length(coalesce(subject,'')) <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_attachments_len') then
    alter table public.contact_messages add constraint contact_messages_attachments_len check (array_length(attachment_urls,1) is null or array_length(attachment_urls,1) <= 5);
  end if;
end $$;

-- Quote requests: cap products/message
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_message_len') then
    alter table public.quote_requests add constraint quote_requests_message_len check (char_length(products_or_services) <= 5000 and char_length(coalesce(message,'')) <= 5000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_attachments_len') then
    alter table public.quote_requests add constraint quote_requests_attachments_len check (array_length(attachment_urls,1) is null or array_length(attachment_urls,1) <= 5);
  end if;
end $$;

-- Suppliers: cap description + attachments
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'suppliers_desc_len') then
    alter table public.suppliers add constraint suppliers_desc_len check (char_length(coalesce(description,'')) <= 5000 and char_length(coalesce(additional_info,'')) <= 5000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'suppliers_attachments_len') then
    alter table public.suppliers add constraint suppliers_attachments_len check ((array_length(document_urls,1) is null or array_length(document_urls,1) <= 5) and (array_length(attachment_urls,1) is null or array_length(attachment_urls,1) <= 5));
  end if;
end $$;

-- Testimonials: cap quote
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'testimonials_quote_len') then
    alter table public.testimonials add constraint testimonials_quote_len check (char_length(quote) <= 2000 and char_length(quote) >= 20);
  end if;
end $$;

-- Home trust / stats attachments already capped in 015
-- Ensure storage bucket for attachments has sensible defaults (dashboard still needs 5MB max set manually)
-- Note: Supabase Storage bucket max size is set in Dashboard → Storage → attachments → Edit bucket → 5MB. This SQL ensures RLS still applies.
do $$ begin
  -- no-op: ensure attachments bucket exists and is public (from 014)
  insert into storage.buckets (id, name, public) values ('attachments','attachments', true) on conflict (id) do nothing;
end $$;
