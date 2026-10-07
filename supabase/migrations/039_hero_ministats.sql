-- ============================================================
-- GNAB — 039 Hero mini-stats
-- Makes the three mini-stats under the Home hero
-- (100+ Suppliers / 500+ Products / 24h Response) editable in
-- Admin → Home → Hero instead of hardcoded in HomePage.
-- Idempotent: safe to re-run.
-- Run after 001→038 in Supabase SQL Editor.
-- ============================================================

alter table public.home_hero
  add column if not exists ministat1_value text not null default '100+',
  add column if not exists ministat1_label text not null default 'Suppliers',
  add column if not exists ministat2_value text not null default '500+',
  add column if not exists ministat2_label text not null default 'Products',
  add column if not exists ministat3_value text not null default '24h',
  add column if not exists ministat3_label text not null default 'Response';

-- Backfill rows created before these columns existed (defaults apply to new
-- rows automatically; this covers pre-039 rows holding NULLs from older clients)
update public.home_hero set ministat1_value = '100+' where ministat1_value is null or ministat1_value = '';
update public.home_hero set ministat1_label = 'Suppliers' where ministat1_label is null or ministat1_label = '';
update public.home_hero set ministat2_value = '500+' where ministat2_value is null or ministat2_value = '';
update public.home_hero set ministat2_label = 'Products' where ministat2_label is null or ministat2_label = '';
update public.home_hero set ministat3_value = '24h' where ministat3_value is null or ministat3_value = '';
update public.home_hero set ministat3_label = 'Response' where ministat3_label is null or ministat3_label = '';
