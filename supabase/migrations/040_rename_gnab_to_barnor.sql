-- ============================================================
-- 040 — Rename GNAB to Barnor Business Solutions (comprehensive)
-- Run AFTER migrations 001-039 to correct all seeded/existing data
-- ============================================================

-- ------------------------------------------------------------
-- 1. site_settings — core branding & copy
-- ------------------------------------------------------------
UPDATE public.site_settings SET value = 'Barnor Business Solutions' WHERE key = 'company_name';
UPDATE public.site_settings SET value = 'barnorsolutions@gmail.com' WHERE key = 'email';
UPDATE public.site_settings SET value = 'Barnor Business Solutions | One Partner. Endless Solutions.' WHERE key = 'seo_title';
UPDATE public.site_settings SET value = 'Barnor Business Solutions  •  One Partner. Endless Solutions.  •  Simplifying procurement for organisations across Ghana and Beyond.' WHERE key = 'footer_text';

-- About page
UPDATE public.site_settings SET value = 'Barnor Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.' WHERE key = 'about_story_p1';
UPDATE public.site_settings SET value = 'Experience the Barnor difference in procurement and supply solutions.' WHERE key = 'about_cta_subtitle';

-- Why Us page
UPDATE public.site_settings SET value = 'Organisations across Ghana choose Barnor because we treat procurement as a partnership, not a transaction.' WHERE key = 'whyus_hero_subtitle';
UPDATE public.site_settings SET value = 'The Barnor Way' WHERE key = 'whyus_comparison_barnor_title';
UPDATE public.site_settings SET value = 'Why Barnor' WHERE key = 'whyus_cta_eyebrow';
UPDATE public.site_settings SET value = 'Experience the Barnor Difference' WHERE key = 'whyus_cta_title';
UPDATE public.site_settings SET value = 'Barnor Difference' WHERE key = 'whyus_cta_title_highlight';

-- Supplier page
UPDATE public.site_settings SET value = 'Barnor Supplier' WHERE key = 'supplier_hero_title_highlight';

-- Testimonials page
UPDATE public.site_settings SET value = 'Barnor' WHERE key = 'testimonials_hero_title_highlight';

-- Home CTA
UPDATE public.site_settings SET value = 'Let Barnor handle your sourcing, pricing and delivery — one partner, endless solutions. Your free quotation lands within 24 hours.' WHERE key = 'home_cta.subtitle' OR key = 'home_cta_subtitle';

-- ------------------------------------------------------------
-- 2. pdf_templates — all active templates
-- ------------------------------------------------------------
UPDATE public.pdf_templates SET
  header_company_name = 'Barnor Business Solutions',
  header_contact = 'barnorsolutions@gmail.com  •  +233 55 427 3445  •  Accra, Ghana',
  footer_text = 'Barnor Business Solutions  •  One Partner. Endless Solutions.  •  Simplifying procurement for organisations across Ghana and Beyond.',
  subject_template = REPLACE(subject_template, 'GNAB', 'Barnor'),
  body_template = REPLACE(body_template, 'GNAB', 'Barnor'),
  terms_template = REPLACE(terms_template, 'GNAB', 'Barnor')
WHERE is_active = true;

-- Also update inactive templates for consistency
UPDATE public.pdf_templates SET
  header_company_name = 'Barnor Business Solutions',
  header_contact = 'barnorsolutions@gmail.com  •  +233 55 427 3445  •  Accra, Ghana',
  footer_text = 'Barnor Business Solutions  •  One Partner. Endless Solutions.  •  Simplifying procurement for organisations across Ghana and Beyond.',
  subject_template = REPLACE(subject_template, 'GNAB', 'Barnor'),
  body_template = REPLACE(body_template, 'GNAB', 'Barnor'),
  terms_template = REPLACE(terms_template, 'GNAB', 'Barnor');

-- ------------------------------------------------------------
-- 3. home_hero — hero badge & CTA
-- ------------------------------------------------------------
UPDATE public.home_hero SET
  badge = 'Welcome to Barnor Business Solutions',
  subtitle = 'We simplify procurement through reliable sourcing, competitive pricing and timely delivery — across Ghana and beyond.'
WHERE badge = 'Welcome to GNAB Business Solutions';

-- ------------------------------------------------------------
-- 4. home_about — about section
-- ------------------------------------------------------------
UPDATE public.home_about SET
  paragraph1 = 'Barnor Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.'
WHERE paragraph1 = 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.';

-- ------------------------------------------------------------
-- 5. home_cta — CTA section
-- ------------------------------------------------------------
UPDATE public.home_cta SET
  subtitle = 'Let Barnor handle your sourcing, pricing and delivery — one partner, endless solutions. Your free quotation lands within 24 hours.'
WHERE subtitle = 'Let GNAB handle your sourcing, pricing and delivery — one partner, endless solutions. Your free quotation lands within 24 hours.';

-- ------------------------------------------------------------
-- 6. site_images — alt text for accessibility/SEO
-- ------------------------------------------------------------
UPDATE public.site_images SET
  alt_text = REPLACE(REPLACE(REPLACE(alt_text, 'GNAB team', 'Barnor team'), 'GNAB logistics', 'Barnor logistics'), 'GNAB ', 'Barnor ')
WHERE alt_text ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 7. blog_posts — any existing posts with GNAB in title/content
-- ------------------------------------------------------------
UPDATE public.blog_posts SET
  title = REPLACE(REPLACE(title, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor '),
  content = REPLACE(REPLACE(content, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor '),
  excerpt = REPLACE(REPLACE(excerpt, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor '),
  meta_title = REPLACE(REPLACE(meta_title, 'GNAB Business Solutions', 'Barnor Business Solutions'), '| GNAB', '| Barnor'),
  meta_description = REPLACE(REPLACE(meta_description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE 
  title ILIKE '%GNAB%' OR
  content ILIKE '%GNAB%' OR
  excerpt ILIKE '%GNAB%' OR
  meta_title ILIKE '%GNAB%' OR
  meta_description ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 8. testimonials — sample/default content
-- ------------------------------------------------------------
UPDATE public.testimonials SET
  quote = REPLACE(REPLACE(quote, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE quote ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 9. quote_requests — RFQ numbers (keep format, just update display if needed)
-- Note: RFQ numbers like GNAB-2026-XXXXXX are historical identifiers
-- We keep them as-is for audit trail, but new ones use BARN- prefix via code

-- ------------------------------------------------------------
-- 10. quotations — quotation numbers (same as above, keep historical)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 11. receipts — receipt numbers (keep historical)
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 12. assistant_questions — admin Q&A content
-- ------------------------------------------------------------
UPDATE public.assistant_questions SET
  question = REPLACE(REPLACE(question, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor '),
  answer = REPLACE(REPLACE(answer, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE question ILIKE '%GNAB%' OR answer ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 13. contact_messages — admin replies
-- ------------------------------------------------------------
UPDATE public.contact_messages SET
  admin_reply = REPLACE(REPLACE(admin_reply, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE admin_reply ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 14. services — footer_label if any reference GNAB
-- ------------------------------------------------------------
UPDATE public.services SET
  footer_label = REPLACE(footer_label, 'GNAB', 'Barnor'),
  name = REPLACE(name, 'GNAB', 'Barnor')
WHERE footer_label ILIKE '%GNAB%' OR name ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 15. industries — any reference
-- ------------------------------------------------------------
UPDATE public.industries SET
  name = REPLACE(name, 'GNAB', 'Barnor'),
  description = REPLACE(REPLACE(description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE name ILIKE '%GNAB%' OR description ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 16. why_choose_us — any reference
-- ------------------------------------------------------------
UPDATE public.why_choose_us SET
  title = REPLACE(title, 'GNAB', 'Barnor'),
  description = REPLACE(REPLACE(description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE title ILIKE '%GNAB%' OR description ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 17. process_steps — any reference
-- ------------------------------------------------------------
UPDATE public.process_steps SET
  title = REPLACE(title, 'GNAB', 'Barnor'),
  description = REPLACE(REPLACE(description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE title ILIKE '%GNAB%' OR description ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 18. products — any reference in name/description
-- ------------------------------------------------------------
UPDATE public.products SET
  name = REPLACE(name, 'GNAB', 'Barnor'),
  short_description = REPLACE(REPLACE(short_description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor '),
  description = REPLACE(REPLACE(description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE name ILIKE '%GNAB%' OR short_description ILIKE '%GNAB%' OR description ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 19. company_documents — file names/descriptions
-- ------------------------------------------------------------
UPDATE public.company_documents SET
  file_name = REPLACE(file_name, 'GNAB', 'Barnor')
WHERE file_name ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 20. supplier_registrations — company names if they reference GNAB
-- ------------------------------------------------------------
UPDATE public.supplier_registrations SET
  company_name = REPLACE(company_name, 'GNAB', 'Barnor'),
  company_description = REPLACE(REPLACE(company_description, 'GNAB Business Solutions', 'Barnor Business Solutions'), 'GNAB ', 'Barnor ')
WHERE company_name ILIKE '%GNAB%' OR company_description ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- 21. quotes — quotation items descriptions
-- ------------------------------------------------------------
UPDATE public.quotes SET
  items = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'description') ILIKE '%GNAB%' THEN
          jsonb_set(elem, '{description}', to_jsonb(REPLACE(elem->>'description', 'GNAB Business Solutions', 'Barnor Business Solutions')))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(items) AS elem
  )
WHERE items @> '[{"description": "GNAB"}]';

-- ------------------------------------------------------------
-- 22. receipts — receipt items descriptions
-- ------------------------------------------------------------
UPDATE public.receipts SET
  items = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'description') ILIKE '%GNAB%' THEN
          jsonb_set(elem, '{description}', to_jsonb(REPLACE(elem->>'description', 'GNAB Business Solutions', 'Barnor Business Solutions')))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(items) AS elem
  )
WHERE items @> '[{"description": "GNAB"}]';

-- ------------------------------------------------------------
-- 23. Verification queries — run these to confirm
-- ------------------------------------------------------------
-- SELECT key, value FROM public.site_settings WHERE value ILIKE '%GNAB%';
-- SELECT id, header_company_name, header_contact, footer_text, subject_template FROM public.pdf_templates WHERE header_company_name ILIKE '%GNAB%' OR header_contact ILIKE '%GNAB%' OR footer_text ILIKE '%GNAB%' OR subject_template ILIKE '%GNAB%';
-- SELECT id, badge, subtitle FROM public.home_hero WHERE badge ILIKE '%GNAB%' OR subtitle ILIKE '%GNAB%';
-- SELECT id, paragraph1 FROM public.home_about WHERE paragraph1 ILIKE '%GNAB%';
-- SELECT id, subtitle FROM public.home_cta WHERE subtitle ILIKE '%GNAB%';
-- SELECT id, alt_text FROM public.site_images WHERE alt_text ILIKE '%GNAB%';
-- SELECT id, title, excerpt, meta_title FROM public.blog_posts WHERE title ILIKE '%GNAB%' OR excerpt ILIKE '%GNAB%' OR meta_title ILIKE '%GNAB%';
-- SELECT id, quote FROM public.testimonials WHERE quote ILIKE '%GNAB%';
-- SELECT id, question, answer FROM public.assistant_questions WHERE question ILIKE '%GNAB%' OR answer ILIKE '%GNAB%';
-- SELECT id, admin_reply FROM public.contact_messages WHERE admin_reply ILIKE '%GNAB%';
-- SELECT id, footer_label, name FROM public.services WHERE footer_label ILIKE '%GNAB%' OR name ILIKE '%GNAB%';

-- ------------------------------------------------------------
-- End of migration 040
-- ============================================================