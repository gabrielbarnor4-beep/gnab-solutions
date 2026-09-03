-- 026 — Self-host brand assets: point defaults to local /favicon.svg + /og-image.svg
-- Keeps admin control: values remain editable via Admin → Settings → Branding, mirrored live
-- No imgur dependency — defaults ship with dist (public/favicon.svg)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='site_settings') then
    update public.site_settings set value='/favicon.svg' where key='logo_url' and value='https://i.imgur.com/FTPqfBS.png';
    update public.site_settings set value='/favicon.svg' where key='favicon_url' and value='https://i.imgur.com/FTPqfBS.png';
    update public.site_settings set value='/og-image.svg' where key='og_image_url' and value='https://i.imgur.com/FTPqfBS.png';
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='pdf_templates') then
    update public.pdf_templates set header_logo_url='/favicon.svg' where header_logo_url='https://i.imgur.com/FTPqfBS.png';
  end if;
end $$;
