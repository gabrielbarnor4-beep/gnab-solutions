-- ============================================================
-- GNAB — 037 Payment options, account details + package reseeds
-- 1. pdf_templates: editable payment options (accepted modes) +
--    account details (bank / MoMo the customer pays to). Rendered as
--    a "How to Pay" section in quotation + package PDFs when set.
--    Message Reply intentionally gets no seed (rarely relevant).
-- 2. receipts: payment_reference for cheque numbers / MoMo txn IDs /
--    bank references, shown on the customer receipt next to the mode.
-- 3. Reseeds the two 036 package templates with real GHS starting
--    figures (admin edits per RFQ — templates are a floor): website
--    care as a 12-month MONTHLY retainer line (not a one-off), ERP
--    discovery as one fixed fee with deliverables + explicit
--    out-of-scope implementation. Only untouched 036 seeds are
--    replaced — edited templates are never overwritten.
-- Idempotent: safe to re-run. Run after 001→036.
-- ============================================================

-- 1. Template payment columns
alter table public.pdf_templates
  add column if not exists payment_options_template text not null default '';
alter table public.pdf_templates
  add column if not exists account_details_template text not null default '';

-- 2. Receipt reference column
alter table public.receipts
  add column if not exists payment_reference text;

-- 3. Seed accepted modes on quotation + package templates (empty stays hidden)
update public.pdf_templates
set payment_options_template = 'Cash • Cheque • Mobile Money • Bank Transfer'
where type in ('quotation', 'website_package', 'erp_discovery')
  and payment_options_template = '';

-- 4. Website package reseed — real GHS figures, care as monthly retainer
update public.pdf_templates
set
  body_template = 'This package covers a corporate website designed, built and maintained in-house: up to 10 pages, CMS setup with content upload, staff training and a 12-month care retainer (monthly updates, backups and security monitoring). Hardware, if needed, is quoted separately under IT Equipment.',
  terms_template = 'Prices valid for 30 days. Payment terms: 50% advance to start, 50% on go-live. The care plan is a monthly retainer (12 × GHS 400) billed monthly after go-live and renewable annually — it is not a one-off fee.',
  default_items = '[{"description":"Corporate website design & build (up to 10 pages)","quantity":1,"unit_price":12000},{"description":"CMS setup, content upload + staff training","quantity":1,"unit_price":2500},{"description":"Care plan retainer — monthly (updates, backups, security monitoring)","quantity":12,"unit_price":400}]'::jsonb
where type = 'website_package'
  and name = 'Standard Website Package'
  and default_items = '[{"description":"Business website design & build (up to 10 pages)","quantity":1,"unit_price":0},{"description":"CMS setup + training & handover","quantity":1,"unit_price":0},{"description":"Care plan — 3 months (updates, backups, monitoring)","quantity":1,"unit_price":0}]'::jsonb;

-- 5. ERP discovery reseed — one fee, deliverables, implementation out of scope
update public.pdf_templates
set
  body_template = 'This fixed-fee engagement covers ERP discovery only. Deliverables: as-is process review, documented requirements specification, vendor shortlist with comparison, and a written recommendation. Explicitly out of scope: implementation, licensing and data migration — quoted separately as a second engagement after vendor selection. GNAB does not build custom ERP systems.',
  terms_template = 'Fixed-fee discovery engagement as described above. Implementation is out of scope and quoted separately after vendor selection. Proposal valid for 30 days. Payment terms: 100% advance to start.',
  default_items = '[{"description":"ERP discovery engagement — as-is review, requirements, vendor shortlist & recommendation (fixed fee)","quantity":1,"unit_price":15000}]'::jsonb
where type = 'erp_discovery'
  and name = 'ERP Discovery Fixed Fee'
  and default_items = '[{"description":"ERP discovery engagement — as-is review, vendor selection & coordination (fixed fee)","quantity":1,"unit_price":0}]'::jsonb;
