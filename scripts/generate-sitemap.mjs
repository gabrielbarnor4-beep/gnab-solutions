// Generates public/sitemap.xml at build time (runs as `prebuild`).
// Static routes are the single source of truth here; published blog slugs are
// appended live from Supabase when credentials are available, otherwise the
// build falls back to static-only. Never fails the build.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public', 'sitemap.xml')
const FALLBACK_BASE = 'https://gnab-solutions.vercel.app'

// Static routes mirror App.tsx public routes (excludes /supplier-registration
// + dynamic /blog/:slug + admin/404 by design).
const STATIC = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/industries', changefreq: 'monthly', priority: '0.7' },
  { path: '/products', changefreq: 'weekly', priority: '0.9' },
  { path: '/process', changefreq: 'monthly', priority: '0.6' },
  { path: '/why-us', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/quote', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
  { path: '/testimonials', changefreq: 'monthly', priority: '0.5' },
]

function loadDotEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch { /* no .env (CI) — rely on environment */ }
}

async function fetchBlogSlugs(base, url, key) {
  const res = await fetch(
    `${url}/rest/v1/blog_posts?select=slug&status=eq.published&limit=500`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) throw new Error(`blog slugs HTTP ${res.status}`)
  const rows = await res.json()
  return (Array.isArray(rows) ? rows : [])
    .map((r) => r.slug)
    .filter((s) => typeof s === 'string' && s.length > 0)
    .map((s) => ({ path: `/blog/${s}`, changefreq: 'monthly', priority: '0.6' }))
}

function buildXml(base, urls) {
  const items = urls.map(
    (u) => `  <url><loc>${base}${u.path}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>\n`
}

async function main() {
  loadDotEnv()
  const base = (process.env.SITE_URL || process.env.VITE_SITE_URL || FALLBACK_BASE).replace(/\/$/, '')
  let urls = [...STATIC]
  try {
    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('supabase env missing — static-only sitemap')
    const posts = await fetchBlogSlugs(base, url, key)
    urls = [...urls, ...posts]
    console.log(`[sitemap] ${urls.length} urls (${posts.length} blog posts) → ${OUT}`)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.log(`[sitemap] static-only (${urls.length} urls): ${reason}`)
  }
  writeFileSync(OUT, buildXml(base, urls))
}

await main()
