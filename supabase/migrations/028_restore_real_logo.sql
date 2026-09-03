-- 028 — Restore real GNAB logo as default (undo 026 generated /favicon.svg)
-- User wants https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg everywhere
-- by default, but still fully controllable via Admin → Settings → Branding (ImageUploader to media/branding).
-- This also kills the generated GN thunderbolt that admin cannot replace via CONTACT.logo hardcode.
DO $$
DECLARE
  real_logo text := 'https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='site_settings') THEN
    -- If a row is currently the generated /favicon.svg or /og-image.svg, replace it with real logo
    UPDATE public.site_settings SET value = real_logo WHERE key = 'logo_url' AND value IN ('/favicon.svg', '/og-image.svg', 'https://i.imgur.com/FTPqfBS.png');
    UPDATE public.site_settings SET value = real_logo WHERE key = 'favicon_url' AND value IN ('/favicon.svg', '/og-image.svg', 'https://i.imgur.com/FTPqfBS.png');
    UPDATE public.site_settings SET value = real_logo WHERE key = 'og_image_url' AND value IN ('/favicon.svg', '/og-image.svg', 'https://i.imgur.com/FTPqfBS.png');
    -- If keys missing entirely, insert them (first run)
    INSERT INTO public.site_settings (key, value) VALUES ('logo_url', real_logo) ON CONFLICT (key) DO NOTHING;
    INSERT INTO public.site_settings (key, value) VALUES ('favicon_url', real_logo) ON CONFLICT (key) DO NOTHING;
    INSERT INTO public.site_settings (key, value) VALUES ('og_image_url', real_logo) ON CONFLICT (key) DO NOTHING;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pdf_templates') THEN
    UPDATE public.pdf_templates SET header_logo_url = real_logo WHERE header_logo_url IN ('/favicon.svg', '/og-image.svg', 'https://i.imgur.com/FTPqfBS.png');
  END IF;
END $$;
