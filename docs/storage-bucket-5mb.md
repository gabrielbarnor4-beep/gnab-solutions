# Storage — 5 MB bucket limit (Rec 8)

**Enforcement is two-layer:**

1. **DB trigger** `supabase/migrations/021_storage_size_guard.sql:11` `check_attachments_size()` — rejects any `storage.objects` insert where `metadata->>'size' > 5*1024*1024` for `bucket_id='attachments'`. Works even if client JS is bypassed.

2. **Dashboard bucket limit (manual, one click):**
   - Supabase Dashboard → Storage → **attachments** → **Edit bucket** → set **Maximum file size: 5 MB**, Allowed MIME: `image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*, text/plain`, limit 5 files handled by `020` constraint `attachments_len <=5`.
   - `media`/`documents` stay admin-only (`is_admin` RLS `005_catalogue_content.sql:189`).

**Monitoring:** `Admin → Visitor Uploads` `src/pages/admin/UploadsAdminPage.tsx` shows `totalBytes /1GB` bar, by-folder breakdown, bulk delete + DB cleanup (`contact_messages.attachment_urls` etc.). Dashboard `src/pages/admin/DashboardPage.tsx:78` shows entire site storage across 3 buckets.

If you skip dashboard step, trigger still protects, but dashboard limit gives storage-layer rejection before DB.
