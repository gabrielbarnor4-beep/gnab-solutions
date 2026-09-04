-- ============================================================
-- GNAB 031 — Let anonymous visitors evaluate is_admin() (fix map + public reads)
-- Symptom: logged-out visitors get "permission denied for function
-- is_admin" on public reads (e.g. /contact locations), while logged-in
-- admins see everything fine — looks like a "browser difference" but is
-- actually a login-state difference.
-- Root cause: every admin_all_* policy calls public.is_admin(), but 002
-- revoked EXECUTE from anon. When Postgres evaluates the admin branch of
-- a policy for an anonymous query, it aborts with permission denied —
-- even when a public_* policy would have allowed the row.
-- Fix: grant EXECUTE to anon. This is safe: is_admin() is
-- SECURITY DEFINER and returns false whenever auth.uid() is null, so it
-- grants anonymous users no access — it only lets policy evaluation
-- proceed so the public_* policies can allow/deny properly.
-- Idempotent.
-- ============================================================

grant execute on function public.is_admin() to anon;
