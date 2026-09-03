import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, ClipboardList, FileText, HardDrive, Home as HomeIcon, Inbox, Mail, Receipt, Rows3, Settings, Star, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, ErrorBanner, Skeletons } from '@/components/admin/bits'
import type { Row as QuoteRow } from '@/pages/admin/QuotesAdminPage'
import { useSiteSettings } from '@/lib/siteData'

interface Stat {
  label: string
  to: string
  icon: typeof Star
  tone: 'navy' | 'gold' | 'green' | 'amber'
  count: number | null
  hint: string
}

const STATUS_TONE: Record<string, 'gold' | 'blue' | 'green' | 'red' | 'gray' | 'navy'> = {
  new: 'gold',
  under_review: 'blue',
  quotation_prepared: 'navy',
  quotation_sent: 'navy',
  awaiting_customer: 'gray',
  won: 'green',
  lost: 'red',
  closed: 'gray',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  quotation_prepared: 'Quotation Prepared',
  quotation_sent: 'Quotation Sent',
  awaiting_customer: 'Awaiting Customer',
  won: 'Won',
  lost: 'Lost',
  closed: 'Closed',
}

export default function DashboardPage() {
  const s = useSiteSettings()
  const [stats, setStats] = useState<Stat[]>([
    { label: 'New Quote Requests', to: '/admin/quotes', icon: ClipboardList, tone: 'gold', count: null, hint: 'quote_requests' },
    { label: 'New Messages', to: '/admin/messages', icon: Mail, tone: 'navy', count: null, hint: 'contact_messages' },
    { label: 'Pending Assistant Q&A', to: '/admin/assistant', icon: Bot, tone: 'gold', count: null, hint: 'assistant_questions' },
    { label: 'Pending Suppliers', to: '/admin/suppliers', icon: Truck, tone: 'navy', count: null, hint: 'suppliers' },
    { label: 'Pending Testimonials', to: '/admin/testimonials', icon: Star, tone: 'green', count: null, hint: 'testimonials' },
    { label: 'Issued Receipts', to: '/admin/receipts', icon: Receipt, tone: 'green', count: null, hint: 'receipts' },
    { label: 'Visitor Uploads', to: '/admin/uploads', icon: HardDrive, tone: 'amber', count: null, hint: 'storage attachments' },
    { label: 'PDF Templates', to: '/admin/pdf-templates', icon: FileText, tone: 'navy', count: null, hint: 'pdf_templates' },
  ])
  const [recent, setRecent] = useState<QuoteRow[]>([])
  const [recentReceipts, setRecentReceipts] = useState<any[]>([])
  const [storageUsed, setStorageUsed] = useState<number | null>(null)
  const [storageCount, setStorageCount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Dashboard | GNAB Admin'

    const load = async () => {
      const next = [...stats]

      const count = async (table: string, filters: Record<string, string>) => {
        let query = supabase.from(table).select('id', { count: 'exact', head: true })
        for (const [col, val] of Object.entries(filters)) query = query.eq(col, val)
        const { count: n, error: err } = await query
        return err ? null : (n ?? 0)
      }

      next[0]!.count = await count('quote_requests', { status: 'new' })
      next[1]!.count = await count('contact_messages', { status: 'new' })
      next[2]!.count = await count('assistant_questions', { status: 'pending' })
      next[3]!.count = await count('suppliers', { status: 'pending' })
      next[4]!.count = await count('testimonials', { status: 'pending' })
      next[5]!.count = await count('receipts', { status: 'issued' })
      // storage — entire site (all buckets: attachments, media, documents) — mirrors Visitor Uploads
      try {
        const buckets = ['attachments', 'media', 'documents']
        let totalFiles = 0
        let totalBytes = 0
        for (const bucket of buckets) {
          try {
            // walk top-level + known prefixes to estimate size (best-effort, no recursion for dashboard)
            let bucketBytes = 0
            let bucketCount = 0
            const { data: root } = await supabase.storage.from(bucket).list('', { limit: 1000 })
            if (root) {
              bucketCount += root.filter((f: any) => f.id).length
              bucketBytes += (root as any[]).filter((f: any) => f.metadata?.size).reduce((s: number, f: any) => s + (f.metadata.size || 0), 0)
              // also check common prefixes for attachments/media
              for (const p of ['contact', 'quotes', 'suppliers', 'products', 'services', 'home_hero', 'documents']) {
                const { data } = await supabase.storage.from(bucket).list(p, { limit: 1000 })
                if (data) {
                  bucketCount += data.filter((f: any) => f.id).length
                  bucketBytes += (data as any[]).filter((f: any) => f.metadata?.size).reduce((s: number, f: any) => s + (f.metadata.size || 0), 0)
                }
              }
            }
            totalFiles += bucketCount
            totalBytes += bucketBytes
          } catch { /* ignore per bucket */ }
        }
        next[6]!.count = totalFiles
        setStorageUsed(totalBytes)
        setStorageCount(totalFiles)
      } catch {
        next[6]!.count = null
      }
      next[7]!.count = await count('pdf_templates', { is_active: 'true' } as any)

      setStats(next)

      if (next[0]!.count === null) {
        setError(
          'Some business tables are not set up yet. Run supabase/migrations/004_business_tables.sql and 022_receipts_and_pdf_templates.sql in your Supabase SQL editor, then refresh.'
        )
      } else {
        const { data } = await supabase
          .from('quote_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        setRecent((data as QuoteRow[]) ?? [])
        const { data: rec } = await supabase.from('receipts').select('receipt_number, customer_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(3)
        setRecentReceipts((rec as any[]) ?? [])
      }
      setLoading(false)
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showTopBar = (s.header_show_top_bar ?? 'true') !== 'false'
  const headerVisibleCount = [s.header_show_phone, s.header_show_email, s.header_show_tagline].filter((v) => (v ?? 'true') !== 'false').length

  return (
    <div>
      <PageIntro
        title="Welcome back 👋"
        description="Here is what is happening across GNAB Business Solutions today — including new Home, Footer, Receipts and Uploads."
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="card-hover group flex items-center gap-4 rounded-[24px] border border-gray-100 bg-white p-5 shadow-soft"
          >
            <span
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ${
                s.tone === 'gold'
                  ? 'bg-gold-50 text-gold-600 ring-gold-200'
                  : s.tone === 'navy'
                    ? 'bg-navy-50 text-navy ring-navy-100'
                    : s.tone === 'amber'
                      ? 'bg-amber-50 text-amber-600 ring-amber-200'
                      : 'bg-brand-green-50 text-brand-green-600 ring-brand-green-200'
              }`}
            >
              <s.icon size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-light">{s.label}</p>
              {loading ? (
                <span className="mt-1 block h-7 w-12 animate-pulse rounded-lg bg-mist" />
              ) : (
                <p className="font-display text-2xl font-extrabold text-navy">{s.count ?? '—'}</p>
              )}
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-navy" />
          </Link>
        ))}
      </div>

      {!loading && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gold-200 bg-gold-50 px-6 py-4 lg:col-span-2">
            <p className="text-sm font-semibold text-navy">
              {(() => {
                const total = stats.slice(0, 5).reduce((sum, s) => sum + (s.count ?? 0), 0)
                if (total === 0) return 'All caught up — no pending actions.'
                return `You have ${total} action${total === 1 ? '' : 's'} to respond to across quotes, messages, suppliers, testimonials and assistant.`
              })()}
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Receipts issued: <span className="font-bold text-navy">{stats[5]!.count ?? '—'}</span> · PDF templates active: <span className="font-bold text-navy">{stats[7]!.count ?? '—'}</span> · Header top bar: <span className={showTopBar ? 'text-brand-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{showTopBar ? `Visible (${headerVisibleCount}/3 items)` : 'Hidden'}</span> · Footer columns: <span className="font-semibold text-navy">{[s.footer_show_brand, s.footer_show_quick_links, s.footer_show_services, s.footer_show_contact].filter((v) => (v ?? 'true') !== 'false').length}/4</span> visible
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white"><HardDrive size={18} /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Entire site storage</p>
                <p className="font-display text-lg font-bold text-navy">{storageUsed !== null ? `${(storageUsed / (1024 * 1024)).toFixed(1)} MB used` : '—'} <span className="text-xs font-normal text-ink-light">· {storageUsed !== null ? `${((1024 * 1024 * 1024 - storageUsed) / (1024 * 1024)).toFixed(1)} MB free / 1024 MB` : ''}</span></p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
              <div className={`h-full transition-all ${storageUsed !== null && storageUsed / (1024 * 1024 * 1024) > 0.8 ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-navy to-brand-green-500'}`} style={{ width: `${Math.min(100, ((storageUsed ?? 0) / (1024 * 1024 * 1024)) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-light">{storageCount ?? '—'} file(s) across all buckets (media, documents, attachments) · <Link to="/admin/uploads" className="font-semibold text-brand-green-600 hover:underline">Manage storage →</Link></p>
          </div>
        </div>
      )}

      {/* Quick actions for new sections */}
      <section className="mt-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Quick actions — new</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/home" className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft hover:border-navy-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy"><HomeIcon size={18} /></span>
            <span className="text-sm font-semibold text-navy">Edit Home Page</span>
          </Link>
          <Link to="/admin/footer" className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft hover:border-navy-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy"><Rows3 size={18} /></span>
            <span className="text-sm font-semibold text-navy">Manage Footer</span>
          </Link>
          <Link to="/admin/receipts" className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft hover:border-navy-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-600 ring-1 ring-brand-green-200"><Receipt size={18} /></span>
            <span className="text-sm font-semibold text-navy">Issue Receipt</span>
          </Link>
          <Link to="/admin/pdf-templates" className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft hover:border-navy-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-gold-200"><FileText size={18} /></span>
            <span className="text-sm font-semibold text-navy">Edit PDF Templates</span>
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link to="/admin/settings" className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span className="text-sm font-semibold text-navy">Header top bar: {showTopBar ? 'Visible' : 'Hidden'} — toggle in Settings → Header Display</span>
            <Settings size={16} className="text-amber-600" />
          </Link>
          <Link to="/admin/uploads" className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
            <span className="text-sm font-semibold text-navy">Visitor Uploads — free up Supabase storage</span>
            <HardDrive size={16} className="text-navy" />
          </Link>
        </div>
      </section>

      {/* Recent quote requests */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy">Latest Quote Requests</h3>
          <Link to="/admin/quotes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <Skeletons />
        ) : recent.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-white p-12 text-center">
            <Inbox size={32} className="mx-auto text-gray-300" />
            <p className="mt-3 font-display font-bold text-navy">No quote requests yet</p>
            <p className="mt-1 text-sm text-ink-light">
              Submissions from the website's Request a Quote form will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-soft">
            <ul className="divide-y divide-gray-50">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-mist/60 sm:px-6">
                  <span className="font-mono text-xs font-bold text-gold-600">{r.rfq_number}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-navy">
                    {r.full_name}
                    {r.company_name ? ` · ${r.company_name}` : ''}
                  </span>
                  <span className="hidden max-w-[220px] truncate text-sm text-ink-light md:block">
                    {r.other_product || r.product_item || r.product_category || r.products_or_services}
                  </span>
                  <Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                  <time className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Recent receipts */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy">Latest Receipts</h3>
          <Link to="/admin/receipts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <Skeletons />
        ) : recentReceipts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-white p-8 text-center">
            <Receipt size={28} className="mx-auto text-gray-300" />
            <p className="mt-2 font-display font-bold text-navy">No receipts yet</p>
            <p className="mt-1 text-sm text-ink-light">Issue a receipt from a won quotation — it will be emailed as a premium PDF.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-soft">
            <ul className="divide-y divide-gray-50">
              {recentReceipts.map((r: any) => (
                <li key={r.receipt_number} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 hover:bg-mist/60 sm:px-6">
                  <span className="font-mono text-xs font-bold text-brand-green-600">{r.receipt_number}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-navy">{r.customer_name}</span>
                  <span className="text-sm font-semibold text-navy">GHS {Number(r.total_amount).toFixed(2)}</span>
                  <Badge tone={r.status === 'paid' ? 'green' : r.status === 'issued' ? 'navy' : 'gray'}>{r.status}</Badge>
                  <time className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-GB')}</time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
