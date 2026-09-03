import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, FileText, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/* useQuerySearch — list-page search boxes honour ?q= (set by palette)  */
/* Syncs when the URL query changes (palette → same page), but never   */
/* clobbers typing (typing doesn't touch the URL).                      */
/* ------------------------------------------------------------------ */
export function useQuerySearch(): [string, (v: string) => void] {
  const [params] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [search, setSearch] = useState(initial)
  const prevQ = useRef(initial)
  useEffect(() => {
    const q = params.get('q') ?? ''
    if (q !== prevQ.current) {
      prevQ.current = q
      setSearch(q)
    }
  }, [params])
  return [search, setSearch]
}

/* ------------------------------------------------------------------ */
/* Page index — mirrors AdminLayout NAV (labels + routes)               */
/* ------------------------------------------------------------------ */
export interface AdminPageEntry {
  to: string
  label: string
  hint: string
}

export const ADMIN_PAGES: AdminPageEntry[] = [
  { to: '/admin/dashboard', label: 'Dashboard', hint: 'stats, storage, recent RFQs' },
  { to: '/admin/home', label: 'Home Page', hint: 'hero, trust, about, stats, CTA' },
  { to: '/admin/pages', label: 'Site Pages', hint: 'page chrome + design' },
  { to: '/admin/footer', label: 'Footer', hint: 'columns, links, headings' },
  { to: '/admin/uploads', label: 'Storage Manager', hint: 'all buckets, files + trash' },
  { to: '/admin/quotes', label: 'Quote Requests', hint: 'RFQ pipeline, PDFs' },
  { to: '/admin/receipts', label: 'Receipts', hint: 'RCPT numbers, payments' },
  { to: '/admin/pdf-templates', label: 'PDF Templates', hint: 'quotation, reply, receipt' },
  { to: '/admin/messages', label: 'Messages', hint: 'contact inbox, replies' },
  { to: '/admin/suppliers', label: 'Supplier Registrations', hint: 'pending, approved' },
  { to: '/admin/products', label: 'Products', hint: 'catalogue, categories' },
  { to: '/admin/services', label: 'Services', hint: 'cards, footer toggle' },
  { to: '/admin/industries', label: 'Industries', hint: 'sectors grid' },
  { to: '/admin/why-us', label: 'Why Choose Us', hint: 'feature cards' },
  { to: '/admin/process', label: 'Process Steps', hint: '6-step journey' },
  { to: '/admin/media', label: 'Media Library', hint: 'site images' },
  { to: '/admin/locations', label: 'Locations', hint: 'map pins' },
  { to: '/admin/assistant', label: 'Assistant Q&A', hint: 'pending, published FAQs' },
  { to: '/admin/blog', label: 'Blog & Insights', hint: 'posts, categories' },
  { to: '/admin/testimonials', label: 'Testimonials', hint: 'pending, approved' },
  { to: '/admin/downloads', label: 'Downloads', hint: 'company profile PDF' },
  { to: '/admin/settings', label: 'Settings', hint: 'company, branding, header' },
]

export function filterAdminPages(query: string): AdminPageEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return ADMIN_PAGES
  return ADMIN_PAGES.filter(
    (p) => p.label.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q) || p.to.toLowerCase().includes(q),
  )
}

/* ------------------------------------------------------------------ */
/* Record sources — live Supabase ilike search per table                */
/* ------------------------------------------------------------------ */
interface RecordSource {
  table: string
  page: string
  pageLabel: string
  columns: string
  orFilter: (like: string) => string
  title: (row: Record<string, unknown>) => string
  sub: (row: Record<string, unknown>) => string
}

const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')

const RECORD_SOURCES: RecordSource[] = [
  {
    table: 'quote_requests', page: '/admin/quotes', pageLabel: 'Quote Requests', columns: 'id,rfq_number,full_name,email,company_name,status',
    orFilter: (l) => `rfq_number.ilike.${l},full_name.ilike.${l},email.ilike.${l},company_name.ilike.${l}`,
    title: (r) => `${str(r.rfq_number) || 'RFQ'} — ${str(r.full_name) || 'Unknown'}`,
    sub: (r) => [str(r.company_name), str(r.email), str(r.status)].filter(Boolean).join(' · '),
  },
  {
    table: 'receipts', page: '/admin/receipts', pageLabel: 'Receipts', columns: 'id,receipt_number,customer_name,status',
    orFilter: (l) => `receipt_number.ilike.${l},customer_name.ilike.${l}`,
    title: (r) => `${str(r.receipt_number) || 'Receipt'} — ${str(r.customer_name) || 'Unknown'}`,
    sub: (r) => str(r.status),
  },
  {
    table: 'contact_messages', page: '/admin/messages', pageLabel: 'Messages', columns: 'id,full_name,email,subject,status',
    orFilter: (l) => `full_name.ilike.${l},email.ilike.${l},subject.ilike.${l}`,
    title: (r) => `${str(r.full_name) || 'Message'} — ${str(r.subject) || 'No subject'}`,
    sub: (r) => [str(r.email), str(r.status)].filter(Boolean).join(' · '),
  },
  {
    table: 'suppliers', page: '/admin/suppliers', pageLabel: 'Suppliers', columns: 'id,company_name,contact_person,email,status',
    orFilter: (l) => `company_name.ilike.${l},contact_person.ilike.${l},email.ilike.${l}`,
    title: (r) => str(r.company_name) || str(r.contact_person) || 'Supplier',
    sub: (r) => [str(r.contact_person), str(r.email), str(r.status)].filter(Boolean).join(' · '),
  },
  {
    table: 'products', page: '/admin/products', pageLabel: 'Products', columns: 'id,name,category,status',
    orFilter: (l) => `name.ilike.${l},category.ilike.${l}`,
    title: (r) => str(r.name) || 'Product',
    sub: (r) => [str(r.category), str(r.status)].filter(Boolean).join(' · '),
  },
  {
    table: 'services', page: '/admin/services', pageLabel: 'Services', columns: 'id,name,category',
    orFilter: (l) => `name.ilike.${l},category.ilike.${l}`,
    title: (r) => str(r.name) || 'Service',
    sub: (r) => str(r.category),
  },
  {
    table: 'industries', page: '/admin/industries', pageLabel: 'Industries', columns: 'id,name',
    orFilter: (l) => `name.ilike.${l}`,
    title: (r) => str(r.name) || 'Industry',
    sub: () => '',
  },
  {
    table: 'blog_posts', page: '/admin/blog', pageLabel: 'Blog', columns: 'id,title,category,status',
    orFilter: (l) => `title.ilike.${l},category.ilike.${l}`,
    title: (r) => str(r.title) || 'Post',
    sub: (r) => [str(r.category), str(r.status)].filter(Boolean).join(' · '),
  },
  {
    table: 'testimonials', page: '/admin/testimonials', pageLabel: 'Testimonials', columns: 'id,client_name,company,status',
    orFilter: (l) => `client_name.ilike.${l},company.ilike.${l}`,
    title: (r) => str(r.client_name) || 'Testimonial',
    sub: (r) => [str(r.company), str(r.status)].filter(Boolean).join(' · '),
  },
  {
    table: 'locations', page: '/admin/locations', pageLabel: 'Locations', columns: 'id,name,address',
    orFilter: (l) => `name.ilike.${l},address.ilike.${l}`,
    title: (r) => str(r.name) || 'Location',
    sub: (r) => str(r.address),
  },
  {
    table: 'assistant_questions', page: '/admin/assistant', pageLabel: 'Assistant Q&A', columns: 'id,question,status',
    orFilter: (l) => `question.ilike.${l}`,
    title: (r) => (str(r.question).slice(0, 80) || 'Question'),
    sub: (r) => str(r.status),
  },
]

export interface RecordHit {
  key: string
  page: string
  pageLabel: string
  title: string
  sub: string
}

/** Sanitize for PostgREST `or` ilike (commas/parens/percent break the parser). */
export function sanitizeLike(q: string): string {
  return q.replace(/[%(),\\]/g, '').trim().slice(0, 60)
}

async function searchRecords(query: string): Promise<RecordHit[]> {
  const clean = sanitizeLike(query)
  if (clean.length < 2) return []
  const like = `%${clean}%`
  const settled = await Promise.all(
    RECORD_SOURCES.map(async (src) => {
      try {
        const { data, error } = await supabase.from(src.table).select(src.columns).or(src.orFilter(like)).limit(4)
        if (error || !data) return []
        return (data as unknown as Record<string, unknown>[]).map((row, i) => ({
          key: `${src.table}-${str(row.id) || i}`,
          page: src.page,
          pageLabel: src.pageLabel,
          title: src.title(row),
          sub: src.sub(row),
        }))
      } catch {
        return []
      }
    }),
  )
  return settled.flat().slice(0, 24)
}

/* ------------------------------------------------------------------ */
/* AdminSearch — ⌘K palette: pages + live records                       */
/* ------------------------------------------------------------------ */
export default function AdminSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<RecordHit[]>([])
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const seq = useRef(0)

  const pages = useMemo(() => filterAdminPages(query).slice(0, 8), [query])

  const go = useCallback(
    (to: string, withQuery: string | null) => {
      setOpen(false)
      setQuery('')
      setHits([])
      void navigate(withQuery ? `${to}?q=${encodeURIComponent(withQuery)}` : to)
    },
    [navigate],
  )

  // ⌘K / Ctrl+K toggles from anywhere in admin
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      document.body.style.overflow = 'hidden'
      return () => {
        clearTimeout(t)
        document.body.style.overflow = ''
      }
    }
    setQuery('')
    setHits([])
  }, [open ])

  // Debounced live record search
  useEffect(() => {
    if (!open || sanitizeLike(query).length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    const my = ++seq.current
    const t = setTimeout(() => {
      void searchRecords(query).then((res) => {
        if (seq.current !== my) return
        setHits(res)
        setSearching(false)
      })
    }, 250)
    return () => clearTimeout(t)
  }, [query, open])

  const flat: { label: string; sub: string; run: () => void }[] = useMemo(
    () => [
      ...pages.map((p) => ({
        label: p.label,
        sub: p.hint,
        run: () => go(p.to, null),
      })),
      ...hits.map((h) => ({
        label: h.title,
        sub: `${h.pageLabel}${h.sub ? ` · ${h.sub}` : ''}`,
        run: () => go(h.page, query.trim()),
      })),
    ],
    [pages, hits, go, query],
  )

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      flat[active]!.run()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search admin (Ctrl+K)"
        className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink-light transition-colors hover:border-navy-300 hover:text-navy md:inline-flex"
      >
        <Search size={15} />
        <span className="text-gray-400">Search anything…</span>
        <kbd className="rounded-md bg-mist px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500">⌘K</kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search admin"
        className="rounded-xl p-2 text-navy transition-colors hover:bg-navy-50 md:hidden"
      >
        <Search size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Admin search">
          <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-lift">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4">
              <Search size={17} className="flex-shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onInputKey}
                placeholder="Search pages, quotes, messages, products…"
                className="w-full bg-transparent py-4 text-[15px] text-ink outline-none placeholder:text-gray-400"
              />
              {query ? (
                <button onClick={() => setQuery('')} aria-label="Clear" className="rounded-lg p-1 text-gray-400 hover:bg-mist">
                  <X size={15} />
                </button>
              ) : (
                <kbd className="flex-shrink-0 rounded-md bg-mist px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500">ESC</kbd>
              )}
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {pages.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Pages</p>
                  {pages.map((p, i) => (
                    <button
                      key={p.to}
                      onClick={() => go(p.to, null)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${active === i ? 'bg-navy-50' : ''}`}
                    >
                      <FileText size={15} className="flex-shrink-0 text-navy-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy">{p.label}</span>
                        <span className="block truncate text-xs text-gray-400">{p.hint}</span>
                      </span>
                      <ArrowRight size={14} className="flex-shrink-0 text-gray-300" />
                    </button>
                  ))}
                </div>
              )}

              {sanitizeLike(query).length >= 2 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    Records {searching ? '· searching…' : hits.length > 0 ? `· ${hits.length}` : '· no matches'}
                  </p>
                  {hits.map((h, j) => {
                    const idx = pages.length + j
                    return (
                      <button
                        key={h.key}
                        onClick={() => go(h.page, query.trim())}
                        onMouseEnter={() => setActive(idx)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${active === idx ? 'bg-navy-50' : ''}`}
                      >
                        <Search size={15} className="flex-shrink-0 text-gold-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-navy">{h.title}</span>
                          <span className="block truncate text-xs text-gray-400">{h.sub || h.pageLabel}</span>
                        </span>
                        <span className="flex-shrink-0 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold text-ink-light">{h.pageLabel}</span>
                      </button>
                    )
                  })}
                  {!searching && hits.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-gray-400">No records match — try a name, email, RFQ or receipt number.</p>
                  )}
                </div>
              )}

              {pages.length === 0 && sanitizeLike(query).length < 2 && (
                <p className="px-3 py-4 text-center text-sm text-gray-400">No pages match “{query}”.</p>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-gray-100 bg-mist/50 px-4 py-2.5 text-[11px] text-gray-400">
              <span><kbd className="font-mono font-bold">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono font-bold">↵</kbd> open</span>
              <span><kbd className="font-mono font-bold">esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
