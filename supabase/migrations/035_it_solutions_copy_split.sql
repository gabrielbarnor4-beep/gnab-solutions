-- ============================================================
-- GNAB — 035 IT Solutions copy sharpening (review follow-up)
-- 1. Hardware/digital split added to the service description so the
--    two IT categories are never confused (hardware stays under
--    IT Equipment). Digital work is scoped, not shipped.
-- 2. ERP product reworded toward discovery / vendor selection /
--    implementation coordination (no custom-ERP-build SKU).
-- Idempotent: safe to re-run. Run after 001→034.
-- ============================================================

update public.services
set full_description = 'Your online presence and back-office systems deserve the same single-partner treatment as everything else you procure. Corporate websites designed, built and maintained in-house. ERP and business systems specified and sourced with specialist partners. Hardware remains under IT Equipment. Every engagement starts with a scoping call, follows with a written proposal, and ends with training and a care or support plan, all with transparent pricing.'
where name = 'IT Solutions & Digital Services';

update public.products
set short_description = 'Discovery, vendor selection and implementation coordination for ERP, CRM and business systems.'
where name = 'ERP & Business Systems'
  and category = 'IT Solutions & Digital Services';
