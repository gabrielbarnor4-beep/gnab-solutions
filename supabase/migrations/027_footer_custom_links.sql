-- ============================================================
-- GNAB 027 — Custom footer label/path per service
-- Lets admin override footer link label and destination
-- per-service without renaming the service itself.
-- ============================================================

alter table public.services
  add column if not exists footer_label text,
  add column if not exists footer_path text;

-- Backfill: null means use auto (name -> slug)
comment on column public.services.footer_label is 'Custom label shown in footer. If null, service name is used.';
comment on column public.services.footer_path is 'Custom path the footer link opens. If null, /services?highlight=slug is used. Must start with / when set.';
