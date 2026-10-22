-- 028 — Self-hosted Barnor brand assets as defaults
-- Defaults to the new /brand/barnor-logo.png (wordmark), /favicon.svg and
-- /brand/barnor-og.png, while remaining fully replaceable via
-- Admin → Settings → Branding (ImageUploader to media/branding).
-- Also migrates any old brand logo URLs that earlier migrations inserted.
DO $$
DECLARE
  real_logo text := '/brand/barnor-logo.png';
  real_favicon text := '/favicon.svg';
  real_og text := '/brand/barnor-og.png';
  legacy text[] := ARRAY[
    '/favicon.svg',
    '/og-image.svg',
    'https://i.imgur.com/FTPqfBS.png',
    'https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
    UPDATE public.site_settings SET value = real_logo WHERE key = 'logo_url' AND value = ANY(legacy);
    UPDATE public.site_settings SET value = real_favicon WHERE key = 'favicon_url' AND value = ANY(legacy);
    UPDATE public.site_settings SET value = real_og WHERE key = 'og_image_url' AND value = ANY(legacy);
    -- If keys are missing entirely, insert them (first run)
    INSERT INTO public.site_settings (key, value) VALUES ('logo_url', real_logo) ON CONFLICT (key) DO NOTHING;
    INSERT INTO public.site_settings (key, value) VALUES ('favicon_url', real_favicon) ON CONFLICT (key) DO NOTHING;
    INSERT INTO public.site_settings (key, value) VALUES ('og_image_url', real_og) ON CONFLICT (key) DO NOTHING;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_templates') THEN
    UPDATE public.pdf_templates SET header_logo_url = real_logo WHERE header_logo_url = ANY(legacy);
  END IF;
END $$;
