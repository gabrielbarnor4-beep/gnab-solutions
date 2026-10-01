-- ============================================================
-- GNAB — 036 Quote package templates (website + ERP discovery)
-- Extends pdf_templates with two IT Solutions package types so the
-- sales process is standardized: a website package (pages / CMS /
-- maintenance retainer) and a fixed-fee ERP discovery engagement.
-- Both are fully editable in Admin → PDF Templates like the other
-- three types (header, colors, title, table, totals, terms, footer
-- + standard line items the quote builder can load in one click).
-- Idempotent: safe to re-run. Run after 001→035.
-- ============================================================

-- 1. Widen the type check (constraint was created inline in 022)
alter table public.pdf_templates drop constraint if exists pdf_templates_type_check;
alter table public.pdf_templates
  add constraint pdf_templates_type_check
  check (type in ('quotation','message_reply','receipt','website_package','erp_discovery'));

-- 2. Standard line items the quote builder can load (admin edits prices per RFQ)
alter table public.pdf_templates
  add column if not exists default_items jsonb not null default '[]'::jsonb;

-- 3. Seeds (insert-missing only; admin owns all copy/prices afterwards)
insert into public.pdf_templates (type, name, subject_template, title_template, subtitle_template, body_template, table_head, totals_template, terms_template, default_items, is_active)
values
  ('website_package', 'Standard Website Package',
   'Your GNAB Website Package Quotation {{quotation_number}} — {{rfq_number}}',
   'Website Package Quotation {{quotation_number}}',
   'Design, build, CMS, training + care plan — in response to {{rfq_number}}',
   'This package covers a corporate website designed, built and maintained in-house: up to 10 pages, CMS setup, staff training and a 3-month care plan (updates, backups, monitoring). Hardware, if needed, is quoted separately under IT Equipment.',
   '["Description","Qty","Unit Price (GHS)","Total (GHS)"]'::jsonb,
   '["Subtotal","Total Amount"]'::jsonb,
   'Package includes up to 10 pages, CMS setup, training and a 3-month care plan. Prices valid for 30 days. Payment terms: 50% advance to start, 50% on go-live. A maintenance retainer is billed separately after the care period.',
   '[{"description":"Business website design & build (up to 10 pages)","quantity":1,"unit_price":0},{"description":"CMS setup + training & handover","quantity":1,"unit_price":0},{"description":"Care plan — 3 months (updates, backups, monitoring)","quantity":1,"unit_price":0}]'::jsonb,
   true),
  ('erp_discovery', 'ERP Discovery Fixed Fee',
   'Your GNAB ERP Discovery Proposal {{quotation_number}} — {{rfq_number}}',
   'ERP Discovery Proposal {{quotation_number}}',
   'Discovery, vendor selection + implementation coordination — in response to {{rfq_number}}',
   'This fixed-fee engagement covers ERP discovery only: stakeholder interviews, requirements documentation, vendor shortlisting and selection support. GNAB does not build custom ERP systems — implementation itself is quoted separately after vendor selection, coordinated with the chosen specialist partner.',
   '["Description","Qty","Unit Price (GHS)","Total (GHS)"]'::jsonb,
   '["Subtotal","Total Amount"]'::jsonb,
   'Fixed-fee discovery engagement. Implementation is quoted separately after vendor selection. Proposal valid for 30 days. Payment terms: 100% advance to start.',
   '[{"description":"ERP discovery — requirements, vendor selection & coordination (fixed fee)","quantity":1,"unit_price":0}]'::jsonb,
   true)
on conflict do nothing;
