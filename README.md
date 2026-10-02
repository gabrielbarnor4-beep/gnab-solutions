# GNAB Business Solutions — One Partner. Endless Solutions.

Ghana's trusted procurement & supply platform. Public marketing site (13 routes) + full admin CMS (22 pages) + AI assistant + maps + PDF quotations/receipts.

Stack: **React 19 + TypeScript 6 + Vite 6 + Tailwind 4 + Supabase (Auth/Postgres/Storage/Edge) + Framer Motion + Leaflet + jsPDF**. Verified: `tsc -b` 0, `oxlint` 0 warnings, `vite build` ~3.5s.

## Quick Start

```bash
# Node 22+ required
npm ci
cp .env.example .env   # fill 3 VITE_ vars below
npm run dev            # http://localhost:5173
npm run build && npm run preview  # http://localhost:4173
npm run lint           # oxlint
npm test               # vitest
npm run test:e2e       # playwright
```

## Environment

**Client (required, `requireEnv` throws if missing):**
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/<id>
```

**Server-only — never `VITE_`, set via `supabase secrets set`:**
```
GEMINI_API_KEY=<google ai studio>  # via supabase/functions/gemini-chat
BREVO_API_KEY=<brevo>              # preferred email, 300/day free
RESEND_API_KEY=<resend>            # fallback
FROM_EMAIL=GNAB Business Solutions <gnabsolutions@gmail.com>
ALLOWED_ORIGIN=https://gnab-solutions.vercel.app  # CORS lockdown, defaults to localhost+supabase origin
VITE_POSTHOG_KEY=<posthog>         # optional, analytics
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

See `.env.example` for full template.

## Database — Run in order

In Supabase Dashboard → SQL Editor, run `supabase/migrations/001_*.sql` → `037_*.sql` (or `supabase db push` locally). Seeds are idempotent.

Key migrations: `001_testimonials` → `022_receipts_and_pdf_templates` → `023_other_pages_contents` → `024_cot_per_page` (per-page CTA copy — filename keeps the `cot` typo on disk) → `025_favicon_og` → `026_selfhost_brand_assets` → `027_footer_custom_links` (adds `services.footer_label/footer_path`) → `028_restore_real_logo` (real Supabase-hosted logo default) → `029_design_options` (20-key heading design system) → `030_cta_features` (per-page CTA strips, like Home) → `031_anon_is_admin_grant` (lets anon evaluate `is_admin()` so logged-out reads work) → `032_automobile_services` + `033_footer_toggles_and_automobile_backfill` (9th catalogue + footer contact items) → `034_it_solutions_digital_services` + `035_it_solutions_copy_split` (10th catalogue + copy split) → `036_quote_package_templates` (`website_package`/`erp_discovery` types + `default_items`) → `037_payment_options_and_package_reseeds` (How-to-Pay section + receipt reference + GHS reseeds), `021_storage_size_guard` (5MB trigger + `rate_limits`).

After migrations:
1. Storage → `attachments` → Edit → set **5 MB max, `image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt` only** — enforces server-side even if client bypassed (`021` trigger is defense-in-depth).
2. `media`/`documents` remain admin-only (`is_admin` RLS).
3. Create first admin: sign up at `/admin/login` → `claim_first_admin()` auto-claims when `admin_users` empty.

## Branding — truly mirrored (Rec 2)

All brand assets are **self-hosted** with admin override — no imgur dependency:

* Default fallback lives in `public/favicon.svg` + `public/og-image.svg` (local, shipped with `dist`).
* Admin → **Settings** → Branding edits `site_settings.logo_url / favicon_url / og_image_url`. Each is stored in `media` bucket via `ImageUploader` and instantly mirrored site-wide:
  * `src/lib/siteData.tsx:400` rewrites `<link rel="icon">`, `<link rel="apple-touch-icon">`, and `<meta property="og:image">` at runtime with cache-busted `?fav=hash` for Safari.
  * `src/components/layout/Header.tsx` + `Footer.tsx` read `useSiteSettings().logo_url`.
  * `src/lib/pdf.ts:LOGO_URL` fallback is the Supabase-hosted brand logo (same URL as `CONTACT.logo`); per-template `header_logo_url` overrides it — editable in **Admin → PDF Templates**.
* `index.html:13` and `src/lib/utils.ts:25` `CONTACT.logo` point to the Supabase-hosted brand logo `media/branding/1788397307996-wb35sl.jpg` (set by `028`), not `https://i.imgur.com/...`.

You keep **full control**: change Logo/Favicon/OG in admin anytime, no rebuild, no code edit.

## Project Structure

```
src/
  App.tsx              # BrowserRouter, lazy 13+22 routes, PublicLayout, useAutoHideScrollbar
  lib/supabase.ts      # createClient + getPublicUrl(bucket,path,opts)
  lib/siteData.tsx     # SiteSettings + DEFAULT_SETTINGS + Provider + fetchers + SEO helpers
  lib/pdf.ts           # generateGnabPdf (jsPDF A4, template-aware, lazy import)
  lib/utils.ts         # cn, CONTACT/COMPANY, NAV_LINKS, canSubmit, isHoneypot, formStr, isAllowedAttachment
  lib/assistant.ts     # FAQ→Gemini→localBrain, getAssistantReply
  components/layout    # Header (glass, per-item top-bar toggles) + Footer (4-col)
  components/admin     # AdminLayout (22 nav + ⌘K search), ProtectedRoute, ImageUploader, bits, AdminSearch (palette + useQuerySearch ?q=), DesignControls
  components/chat      # AssistantWidget
  pages/public         # Home (9 sections) + 12 others (incl. Blog list + /blog/:slug)
  pages/admin          # 22 admin pages incl. Site Pages, Uploads/Receipts/PDF Templates
supabase/migrations    # 001→037 (+ 036 website/ERP quote templates, 037 payments + reseeds)
supabase/functions     # gemini-chat, send-email (Brevo→Resend, CORS + auth + 5MB pdf guard)
public/                # favicon.svg, og-image.svg, sitemap.xml, robots.txt
```

## Admin — Key Workflows

* **Home:** 9 tabs (hero/trust/about/services/industries/why/process/stats/cta) — C/R/U with soft-delete 30d.
* **Site Pages (`/admin/pages`):** 11 tabs + ✨ Design tab — edits page hero/section/CTA chrome in `site_settings`, mirrored 1:1 with hardcoded fallback. Per-page CTA gold highlight + **feature strip (030, like Home CTA)** editable per tab. Feature cards stay in their own admins.
* **Search anything (⌘K):** topbar palette in every admin page — filters all 22 pages instantly + live record search (quotes, receipts, messages, suppliers, products, services, industries, blog, testimonials, locations, assistant Q&A). Record hits deep-link with `?q=` — every list-page search box (incl. new Testimonials box) honours it via `useQuerySearch`.
* **Footer:** toggles `footer_show_*` + per-item Quick Link Shown/Hidden + reorder (11 defaults incl. Reviews + Become a Supplier) + managed Contact items (email/phone/whatsapp/address/hours/link/text, each with toggle + order) + per-service `Show in footer` and custom `Footer label/path` (027).
* **Storage Manager (`/admin/uploads`):** Files tab — recursive `walk('')` all 3 buckets + pagination 1000, bulk delete + DB cleanup (`contact_messages.attachment_urls` etc.), `totalBytes /1GB` bar. **Trash tab** — every soft-deleted item from all 17 admin tables with days-left to the nightly 03:22 purge; restore or permanently purge now (rows + referenced files removed from Supabase instantly).
* **Quotes → Receipts:** RFQ `new→closed` 8 states → Generate PDF via template `fetchPdfTemplate('quotation')` → email via `send-email` edge → Issue Receipt (`RCPT-YYYY-XXXX`) when `won` → `Admin → PDF Templates` (5 tabs: `quotation`/`website_package`/`erp_discovery`/`message_reply`/`receipt`, live header preview, `interpolate {{vars}}`).

## Security

* `ProtectedRoute` + `is_admin()` SECURITY DEFINER, `claim_first_admin`.
* RLS `015` forces `with check (status='new' AND assigned_to null ...)` + triggers cap 5000 chars / 5 attachments, `020` adds constraints, `021` storage 5MB trigger + `rate_limits`.
* Edge `getCorsHeaders` strict `ALLOWED_ORIGIN`, `isAllowedPdfUrl` only `https` + `*.supabase.co/storage/...`, 5s timeout, `MAX_PDF_BYTES 5MB`.
* Client `canSubmit 5/min` + `website_hp` honeypot + `isAllowedAttachment` allowlist; `ImageUploader` compresses >300KB to 1280w webp 0.72.

## Performance & SEO

* `imgSrcSet` 400/800/1200/1600 `&fm=webp` (Unsplash) + `getPublicUrl(..., {width, quality})` Supabase transform (Rec 7) — `sizes` + `fetchPriority high` hero.
* Code-split: `manualChunks` vendor/motion/supabase/pdf/leaflet, `modulePreload false`, `leaflet` + `jspdf` lazy — `index 119k`, `Home 28k`, `leaflet 150k`/`pdf 391k` on demand.
* `setPageMeta` on 9+ public pages + `setOrganizationJsonLd` on Home + `sitemap.xml` 11 static urls (excludes `/supplier-registration` + dynamic `/blog/:slug` by design) + `robots.txt`.
* `useReducedMotion` respects `prefers-reduced-motion`, `Field` a11y via `cloneElement`, scrollbar `is-scrolling` fade.

## PWA & Analytics (Rec 9)

* `vite-plugin-pwa` — offline cache for `/`, `/services`, `/products` (stale-while-revalidate). Manifest: `GNAB Business Solutions`, theme `#0B2E59`, icons from `/favicon.svg`.
* `posthog-js` — pageview + `quote_requested`, `contact_sent`, `assistant_question` events. Opt-in via `VITE_POSTHOG_KEY`; no key → no tracking, no bundle cost beyond lazy import.

## Testing & CI (Rec 6)

```bash
npm test          # vitest — 97 tests: env, routing, honeypot/formStr, canSubmit, imgSrcSet, supabase getPublicUrl, pdf interpolate + RFQ/RCPT formats + package-template routing + payment lines, assistant intents + product search, quote guards (5000 chars/5 files/5MB/20–2000) + IT quote helpers, design system (slugify/splitHighlight/themes), CTA features (030), admin search (pages + sanitizeLike), trash (daysLeft/extractStorageRef/purge/restore)
npm run test:e2e  # playwright — honeypot e2e, header/footer visibility, visitor uploads
```

GitHub Actions `.github/workflows/ci.yml`: `tsc -b` → `oxlint` → `vitest` → `vite build` → `playwright` e2e (smoke tests against the preview build with dummy `VITE_*`; read-only page loads, DB fallbacks cover data fetches) on push/PR.

## Type Safety (Rec 4 + 11)

* `tsconfig.app.json: strict true, noUncheckedIndexedAccess true` — noUnchecked forces `arr[0]?.` checks.
* `src/types/supabase.ts` generated via `supabase gen types typescript --project-id <id> > src/types/supabase.ts` — checked in.
* `oxlint` type-aware: `oxlint-tsgolint` + `options.typeAware true` in `.oxlintrc.json` — `no-floating-promises`/`no-base-to-string` are `error` (all `void` + `formStr` fixed). Intentional React patterns are `off` with justification: `set-state-in-effect` (data-fetch `useEffect → setLoading/setRows`), `only-export-components` (`components/ui` + lib barrels export helpers alongside components), `exhaustive-deps` (manual dep arrays reviewed), `purity` (false positive on `Math.random` inside async handlers).

## Deployment

**Vercel (free):**
1. Push to GitHub `gnab-solutions` → Vercel → Import → set 3 `VITE_*` envs → pick subdomain `gnab-solutions.vercel.app` → Deploy 2 min.
2. `supabase secrets set GEMINI_API_KEY=... ALLOWED_ORIGIN=https://gnab-solutions.vercel.app` → `supabase functions deploy gemini-chat --no-verify-jwt && supabase functions deploy send-email`.
3. Optional: `is-a.dev` → `gnab.is-a.dev` → Vercel → Domains → Add.

Netlify alternative: same envs → `https://gnab-solutions.netlify.app`.

## Storage & Anti-Flood

* DB: `020` constraints + `purge_soft_deleted_30d` 03:22 daily (14 tables, 30d grace).
* Storage: compress 1280w webp (13× smaller), `MAX_MB 5`, `array_length<=5`, `021` trigger, dashboard 5MB cap, `Admin → Uploads` monitor `/1GB`.
* Rate: `canSubmit 5/min` + honeypot; server `rate_limits` ready for edge (hold Rec 3 — needs IP vs email decision before enabling globally).

## Operational Runbook

* **First run:** migrations 001→037 → dashboard 5MB → `/admin/login` claim → verify `Admin → Settings` toggles, `Admin → PDF Templates` 5 active (`quotation`/`website_package`/`erp_discovery`/`message_reply`/`receipt`), `Admin → Services` footer custom label/path, `Admin → Site Pages` 11 tabs, `Admin → Footer` per-item quick-link/contact toggles.
* **Daily:** `/admin/dashboard` counts + `/admin/quotes` pipeline + `/admin/uploads` bar.
* **Weekly:** empty Trash (auto 30d). Archive `contact_messages`/`quote_requests` >6 months if needed.
* **On “5000”/“attachments” DB error:** user hit 5000 char or 5-file cap — shown, no data loss.

## Replication Checklist

- [ ] `npm ci` (Node 22+)
- [ ] `cp .env.example .env` fill 3 `VITE_*`
- [ ] Run `001`→`037` in SQL Editor
- [ ] Storage → `attachments` Edit → 5MB
- [ ] `supabase secrets set GEMINI_API_KEY=...`
- [ ] `supabase functions deploy gemini-chat --no-verify-jwt && supabase functions deploy send-email`
- [ ] `npm run dev` → `http://localhost:5173`
- [ ] `npm run build` + `npm run preview`
- [ ] Create first admin via `/admin/login`
- [ ] Verify brand self-hosted: change Logo in Settings → Header/Footer/PDF update without rebuild
- [ ] Verify `npm test` + `npm run test:e2e` pass
