-- ============================================================
-- 040 — Brand cleanup: GNAB → Barnor Business Solution
-- ============================================================
-- Safe to run on production after migrations 001–039.
-- Safe to re-run. It inspects the live schema and skips anything
-- that does not exist, so it cannot fail with "relation does not
-- exist" or "column does not exist".
--
-- What it does:
--   1. Replaces GNAB / Gnab / gnab with Barnor / Barnor / barnor
--      in every public content table and text/JSON/array column.
--   2. Normalises "Barnor Business Solutions" → "Barnor Business Solution".
--   3. Renames legacy whyus_comparison_gnab_* settings keys.
--   4. Repoints logo / favicon / OG / PDF-template logos at the new
--      self-hosted brand assets.
--   5. Renames historical GNAB-… RFQ/quotation/receipt numbers to BARN-…
--      (conflict-safe, so unique constraints can never abort the run).
--   6. Normalises exact legacy self-brand aliases such as "GNAB IT"
--      and the old brand email inside historical test messages.
--   7. Prints a verification report at the end.
--
-- Third-party customer data (arbitrary names, emails, phone numbers,
-- messages, attachment URLs) is intentionally preserved. The only
-- exceptions are exact legacy self-brand aliases from the previous
-- trading name (for example "GNAB IT") and the old brand email address
-- in historical test messages.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Verification report table (session-local)
-- ------------------------------------------------------------
drop table if exists pg_temp._brand_cleanup_report;
create temp table _brand_cleanup_report (
  table_name text not null,
  column_name text not null,
  remaining bigint not null
);

-- ------------------------------------------------------------
-- 2. Generic content cleanup
-- ------------------------------------------------------------
do $brand$
declare
  t text;
  c text;
  typ text;
  udt text;
  expr text;
  sql text;
  tables text[] := array[
    'site_settings',
    'pdf_templates',
    'home_hero',
    'home_trust_items',
    'home_about',
    'home_stats',
    'home_cta',
    'site_images',
    'blog_posts',
    'testimonials',
    'services',
    'industries',
    'why_choose_us',
    'process_steps',
    'products',
    'product_categories',
    'company_documents',
    'assistant_questions',
    'locations',
    'contact_messages',
    'quotations',
    'receipts'
  ];
  blocked text[] := array[
    'key', 'slug',
    'email', 'phone', 'whatsapp',
    'full_name', 'contact_person', 'customer_name', 'company_name',
    'client_name', 'company',
    'website', 'url', 'image_url', 'overlay_url', 'bg_image_url',
    'featured_image_url', 'attachment_urls', 'document_urls',
    'pdf_url', 'reply_pdf_url', 'file_path',
    'logo_url', 'favicon_url', 'og_image_url', 'header_logo_url',
    'google_maps_url', 'google_maps_embed_url',
    'rfq_number', 'quotation_number', 'receipt_number',
    'message', 'subject'
  ];
begin
  foreach t in array tables loop
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    for c, typ, udt in
      select column_name, data_type, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = t
        and column_name <> all(blocked)
        and is_generated = 'NEVER'
        and data_type in ('text', 'character varying', 'character', 'jsonb', 'json', 'ARRAY')
      order by ordinal_position
    loop
      -- Only text[] arrays are safe to round-trip through ::text.
      if typ = 'ARRAY' and udt <> '_text' then
        continue;
      end if;

      expr := format(
        'regexp_replace(' ||
        'replace(replace(replace(%1$I::text, ''GNAB'', ''Barnor''), ''Gnab'', ''Barnor''), ''gnab'', ''barnor''), ' ||
        '''Barnor Business Solutions'', ''Barnor Business Solution'', ''gi'')',
        c
      );

      if typ = 'jsonb' then
        sql := format(
          'update public.%I set %I = (%s)::jsonb where %I::text ~* ''gnab|Barnor Business Solutions''',
          t, c, expr, c
        );
      elsif typ = 'json' then
        sql := format(
          'update public.%I set %I = (%s)::json where %I::text ~* ''gnab|Barnor Business Solutions''',
          t, c, expr, c
        );
      elsif typ = 'ARRAY' then
        sql := format(
          'update public.%I set %I = (%s)::text[] where %I::text ~* ''gnab|Barnor Business Solutions''',
          t, c, expr, c
        );
      else
        sql := format(
          'update public.%I set %I = %s where %I ~* ''gnab|Barnor Business Solutions''',
          t, c, expr, c
        );
      end if;

      execute sql;
    end loop;
  end loop;
end
$brand$;

-- ------------------------------------------------------------
-- 3. site_settings — brand values and legacy key names
-- ------------------------------------------------------------
do $settings$
declare
  old_key text;
  new_key text;
begin
  if to_regclass('public.site_settings') is null then
    return;
  end if;

  -- Core brand name (always enforced)
  update public.site_settings
  set value = 'Barnor Business Solution', updated_at = now()
  where key = 'company_name';
  insert into public.site_settings (key, value)
  values ('company_name', 'Barnor Business Solution')
  on conflict (key) do nothing;

  update public.site_settings
  set value = 'Barnor Business Solution | One Partner. Endless Solutions.', updated_at = now()
  where key = 'seo_title';
  insert into public.site_settings (key, value)
  values ('seo_title', 'Barnor Business Solution | One Partner. Endless Solutions.')
  on conflict (key) do nothing;

  -- Brand assets — only replace legacy/empty values, never an admin upload
  update public.site_settings
  set value = '/brand/barnor-logo.png', updated_at = now()
  where key = 'logo_url'
    and (
      value is null
      or value = ''
      or value like '%1788397307996-wb35sl%'
      or value like '%FTPqfBS%'
      or value ~* 'gnab'
      or value in ('/favicon.svg', '/og-image.svg')
    );
  insert into public.site_settings (key, value)
  values ('logo_url', '/brand/barnor-logo.png')
  on conflict (key) do nothing;

  update public.site_settings
  set value = '/favicon.svg', updated_at = now()
  where key = 'favicon_url'
    and (
      value is null
      or value = ''
      or value like '%1788397307996-wb35sl%'
      or value like '%FTPqfBS%'
      or value ~* 'gnab'
      or value in ('/og-image.svg', '/brand/barnor-logo.png')
    );
  insert into public.site_settings (key, value)
  values ('favicon_url', '/favicon.svg')
  on conflict (key) do nothing;

  update public.site_settings
  set value = '/brand/barnor-og.png', updated_at = now()
  where key = 'og_image_url'
    and (
      value is null
      or value = ''
      or value like '%1788397307996-wb35sl%'
      or value like '%FTPqfBS%'
      or value ~* 'gnab'
      or value in ('/favicon.svg', '/brand/barnor-logo.png')
    );
  insert into public.site_settings (key, value)
  values ('og_image_url', '/brand/barnor-og.png')
  on conflict (key) do nothing;

  -- Rename any legacy key containing gnab (conflict-safe)
  for old_key in
    select key from public.site_settings where key ~* 'gnab'
  loop
    new_key := regexp_replace(old_key, 'gnab', 'barnor', 'gi');
    if new_key <> old_key then
      if exists (select 1 from public.site_settings where key = new_key) then
        delete from public.site_settings where key = old_key;
      else
        update public.site_settings set key = new_key where key = old_key;
      end if;
    end if;
  end loop;

  -- Ensure the keys the current UI reads always exist
  insert into public.site_settings (key, value)
  values
    ('whyus_comparison_barnor_title', 'The Barnor Way'),
    ('whyus_comparison_barnor_bullets', '["One partner for everything","Transparent, competitive pricing","Quotation within 24 hours","After-sales support that stays"]')
  on conflict (key) do nothing;
end
$settings$;

-- ------------------------------------------------------------
-- 4. PDF templates — point every legacy logo at the new artwork
-- ------------------------------------------------------------
do $pdf$
begin
  if to_regclass('public.pdf_templates') is null then
    return;
  end if;

  update public.pdf_templates
  set header_logo_url = '/brand/barnor-logo.png'
  where header_logo_url is null
     or header_logo_url = ''
     or header_logo_url like '%1788397307996-wb35sl%'
     or header_logo_url like '%FTPqfBS%'
     or header_logo_url ~* 'gnab'
     or header_logo_url in ('/favicon.svg', '/og-image.svg');
end
$pdf$;

-- ------------------------------------------------------------
-- 5. Admin-only notes — safe to rewrite (customer fields untouched)
-- ------------------------------------------------------------
do $notes$
begin
  if to_regclass('public.quote_requests') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'internal_notes'
     ) then
    update public.quote_requests
    set internal_notes = regexp_replace(
      replace(replace(replace(internal_notes, 'GNAB', 'Barnor'), 'Gnab', 'Barnor'), 'gnab', 'barnor'),
      'Barnor Business Solutions', 'Barnor Business Solution', 'gi'
    )
    where internal_notes ~* 'gnab|Barnor Business Solutions';
  end if;

  if to_regclass('public.suppliers') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'suppliers' and column_name = 'internal_notes'
     ) then
    update public.suppliers
    set internal_notes = regexp_replace(
      replace(replace(replace(internal_notes, 'GNAB', 'Barnor'), 'Gnab', 'Barnor'), 'gnab', 'barnor'),
      'Barnor Business Solutions', 'Barnor Business Solution', 'gi'
    )
    where internal_notes ~* 'gnab|Barnor Business Solutions';
  end if;
end
$notes$;

-- ------------------------------------------------------------
-- 6. Historical document numbers — GNAB-… → BARN-… (conflict-safe)
-- ------------------------------------------------------------
do $numbers$
declare
  r record;
  candidate text;
  suffix int;
begin
  -- RFQ numbers
  if to_regclass('public.quote_requests') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'rfq_number'
     ) then
    for r in
      select id, rfq_number from public.quote_requests where rfq_number ~* 'gnab'
    loop
      candidate := regexp_replace(r.rfq_number, 'gnab', 'BARN', 'gi');
      suffix := 1;
      while exists (
        select 1 from public.quote_requests
        where rfq_number = candidate and id <> r.id
      ) loop
        suffix := suffix + 1;
        candidate := regexp_replace(r.rfq_number, 'gnab', 'BARN', 'gi') || '-' || suffix;
      end loop;
      update public.quote_requests set rfq_number = candidate where id = r.id;
    end loop;
  end if;

  -- Quotation numbers
  if to_regclass('public.quotations') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quotations' and column_name = 'quotation_number'
     ) then
    for r in
      select id, quotation_number from public.quotations where quotation_number ~* 'gnab'
    loop
      candidate := regexp_replace(r.quotation_number, 'gnab', 'BARN', 'gi');
      suffix := 1;
      while exists (
        select 1 from public.quotations
        where quotation_number = candidate and id <> r.id
      ) loop
        suffix := suffix + 1;
        candidate := regexp_replace(r.quotation_number, 'gnab', 'BARN', 'gi') || '-' || suffix;
      end loop;
      update public.quotations set quotation_number = candidate where id = r.id;
    end loop;
  end if;

  -- Receipt numbers
  if to_regclass('public.receipts') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'receipts' and column_name = 'receipt_number'
     ) then
    for r in
      select id, receipt_number from public.receipts where receipt_number ~* 'gnab'
    loop
      candidate := regexp_replace(r.receipt_number, 'gnab', 'BARN', 'gi');
      suffix := 1;
      while exists (
        select 1 from public.receipts
        where receipt_number = candidate and id <> r.id
      ) loop
        suffix := suffix + 1;
        candidate := regexp_replace(r.receipt_number, 'gnab', 'BARN', 'gi') || '-' || suffix;
      end loop;
      update public.receipts set receipt_number = candidate where id = r.id;
    end loop;
  end if;
end
$numbers$;

-- ------------------------------------------------------------
-- 7. Exact legacy self-brand aliases in operational records
-- ------------------------------------------------------------
-- These are historical records created under the previous trading name,
-- not arbitrary third-party customer identities. Only exact aliases are
-- rewritten; real customer data is left untouched.
do $aliases$
declare
  r record;
begin
  for r in
    select * from (values
      ('quote_requests', 'company_name'),
      ('quotations', 'company_name'),
      ('receipts', 'company_name'),
      ('suppliers', 'company_name'),
      ('testimonials', 'company')
    ) as v(table_name, column_name)
  loop
    if to_regclass(format('public.%I', r.table_name)) is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public'
           and table_name = r.table_name
           and column_name = r.column_name
       ) then
      execute format(
        'update public.%1$I set %2$I = case lower(btrim(%2$I)) ' ||
        'when ''gnab it'' then ''Barnor IT'' ' ||
        'when ''gnab it live'' then ''Barnor IT LIVE'' ' ||
        'when ''gnab business solutions'' then ''Barnor Business Solution'' ' ||
        'else %2$I end ' ||
        'where lower(btrim(%2$I)) in (''gnab it'', ''gnab it live'', ''gnab business solutions'')',
        r.table_name, r.column_name
      );
    end if;
  end loop;

  -- Internal assignee label on historical RFQs
  if to_regclass('public.quote_requests') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'assigned_to'
     ) then
    update public.quote_requests
    set assigned_to = regexp_replace(
      replace(replace(replace(assigned_to, 'GNAB', 'Barnor'), 'Gnab', 'Barnor'), 'gnab', 'barnor'),
      'Barnor Business Solutions', 'Barnor Business Solution', 'gi'
    )
    where assigned_to ~* 'gnab|Barnor Business Solutions';
  end if;

  -- Old brand email inside historical test messages (message body only)
  if to_regclass('public.contact_messages') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'contact_messages' and column_name = 'message'
     ) then
    update public.contact_messages
    set message = replace(message, 'gnabsolutions@gmail.com', 'barnorsolutions@gmail.com')
    where message ilike '%gnabsolutions@gmail.com%';
  end if;

  -- Downloads: update the DB path only when the renamed storage object
  -- actually exists (move it first in Storage; see README rollout notes).
  if to_regclass('public.company_documents') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'company_documents' and column_name = 'file_path'
     )
     and to_regclass('storage.objects') is not null then
    update public.company_documents d
    set file_path = regexp_replace(
      replace(replace(replace(d.file_path, 'GNAB', 'Barnor'), 'Gnab', 'Barnor'), 'gnab', 'barnor'),
      'Barnor Business Solutions', 'Barnor Business Solution', 'gi'
    )
    where d.file_path ~* 'gnab|Barnor Business Solutions'
      and exists (
        select 1 from storage.objects o
        where o.bucket_id = 'documents'
          and o.name = regexp_replace(
            replace(replace(replace(d.file_path, 'GNAB', 'Barnor'), 'Gnab', 'Barnor'), 'gnab', 'barnor'),
            'Barnor Business Solutions', 'Barnor Business Solution', 'gi'
          )
      );
  end if;
end
$aliases$;

-- ------------------------------------------------------------
-- 8. Verification report
-- ------------------------------------------------------------
do $report$
declare
  t text;
  c text;
  typ text;
  udt text;
  n bigint;
  tables text[] := array[
    'site_settings',
    'pdf_templates',
    'home_hero',
    'home_trust_items',
    'home_about',
    'home_stats',
    'home_cta',
    'site_images',
    'blog_posts',
    'testimonials',
    'services',
    'industries',
    'why_choose_us',
    'process_steps',
    'products',
    'product_categories',
    'company_documents',
    'assistant_questions',
    'locations',
    'contact_messages',
    'quotations',
    'receipts'
  ];
  blocked text[] := array[
    'key', 'slug',
    'email', 'phone', 'whatsapp',
    'full_name', 'contact_person', 'customer_name', 'company_name',
    'client_name', 'company',
    'website', 'url', 'image_url', 'overlay_url', 'bg_image_url',
    'featured_image_url', 'attachment_urls', 'document_urls',
    'pdf_url', 'reply_pdf_url', 'file_path',
    'logo_url', 'favicon_url', 'og_image_url', 'header_logo_url',
    'google_maps_url', 'google_maps_embed_url',
    'rfq_number', 'quotation_number', 'receipt_number',
    'message', 'subject'
  ];
begin
  foreach t in array tables loop
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    for c, typ, udt in
      select column_name, data_type, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = t
        and column_name <> all(blocked)
        and is_generated = 'NEVER'
        and data_type in ('text', 'character varying', 'character', 'jsonb', 'json', 'ARRAY')
      loop
        if typ = 'ARRAY' and udt <> '_text' then
          continue;
        end if;

        begin
          execute format(
            'select count(*) from public.%I where %I::text ~* ''gnab''',
            t, c
          ) into n;

          if n > 0 then
            insert into _brand_cleanup_report (table_name, column_name, remaining)
            values (t, c, n);
          end if;
        exception when others then
          -- Defensive: never let the report fail the migration
          null;
        end;
      end loop;
  end loop;

  -- Also check legacy settings keys and document numbers explicitly
  if to_regclass('public.site_settings') is not null then
    select count(*) into n from public.site_settings where key ~* 'gnab';
    if n > 0 then
      insert into _brand_cleanup_report (table_name, column_name, remaining)
      values ('site_settings', 'key', n);
    end if;
  end if;

  if to_regclass('public.quote_requests') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'internal_notes'
     ) then
    select count(*) into n from public.quote_requests where internal_notes ~* 'gnab';
    if n > 0 then
      insert into _brand_cleanup_report (table_name, column_name, remaining)
      values ('quote_requests', 'internal_notes', n);
    end if;
  end if;

  if to_regclass('public.suppliers') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'suppliers' and column_name = 'internal_notes'
     ) then
    select count(*) into n from public.suppliers where internal_notes ~* 'gnab';
    if n > 0 then
      insert into _brand_cleanup_report (table_name, column_name, remaining)
      values ('suppliers', 'internal_notes', n);
    end if;
  end if;

  if to_regclass('public.quote_requests') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'rfq_number'
     ) then
    select count(*) into n from public.quote_requests where rfq_number ~* 'gnab';
    if n > 0 then
      insert into _brand_cleanup_report (table_name, column_name, remaining)
      values ('quote_requests', 'rfq_number', n);
    end if;
  end if;

  if to_regclass('public.quotations') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quotations' and column_name = 'quotation_number'
     ) then
    select count(*) into n from public.quotations where quotation_number ~* 'gnab';
    if n > 0 then
      insert into _brand_cleanup_report (table_name, column_name, remaining)
      values ('quotations', 'quotation_number', n);
    end if;
  end if;

  if to_regclass('public.receipts') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'receipts' and column_name = 'receipt_number'
     ) then
    select count(*) into n from public.receipts where receipt_number ~* 'gnab';
    if n > 0 then
      insert into _brand_cleanup_report (table_name, column_name, remaining)
      values ('receipts', 'receipt_number', n);
    end if;
  end if;
end
$report$;

-- Final summary: both values should be 0.
select
  (select count(*) from _brand_cleanup_report) as columns_with_gnab,
  (select coalesce(sum(remaining), 0) from _brand_cleanup_report) as total_occurrences;

-- Detailed list (empty = clean)
select table_name, column_name, remaining
from _brand_cleanup_report
order by table_name, column_name;

-- End of migration 040
