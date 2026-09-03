import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Search, Star, Trash2, Undo2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { PageIntro } from '@/components/admin/AdminLayout'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Row {
  id: string
  client_name: string
  client_role: string | null
  company: string | null
  rating: number
  quote: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  rejected_at: string | null
}

const TABS = ['pending', 'approved', 'rejected'] as const

const RETENTION_DAYS = 30

function daysUntilPurge(rejectedAt: string): number {
  const elapsed = Date.now() - new Date(rejectedAt).getTime()
  return Math.max(0, RETENTION_DAYS - Math.floor(elapsed / 86_400_000))
}

export default function TestimonialsAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending')
  const [search, setSearch] = useQuerySearch()
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      setError(
        err.code === '42P01' || err.message.includes('does not exist')
          ? 'The testimonials table does not exist yet. Run the migrations in supabase/migrations (001 → 003) in order in your Supabase SQL editor.'
          : `Failed to load: ${err.message}`
      )
    }
    setRows((data as Row[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Testimonial Moderation | GNAB Admin'
    void load()
  }, [load])

  const counts = useMemo(
    () => ({
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    }),
    [rows]
  )

  const shown = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (r.status !== tab) return false
      if (!q) return true
      return [r.client_name, r.client_role ?? '', r.company ?? '', r.quote].some((v) => v.toLowerCase().includes(q))
    })
  }, [rows, tab, search])

  const setStatus = async (row: Row, status: Row['status']) => {
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('testimonials').update({ status }).eq('id', row.id)
    if (err) {
      setError(
        `Could not set status to "${status}": ${err.message}. If this mentions a check constraint, run migrations 002 & 003 in supabase/migrations — and make sure your user id is inserted into admin_users.`
      )
    }
    setBusyId(null)
    void load()
  }

  const purge = async (row: Row) => {
    if (!window.confirm(`Permanently delete this testimonial now? This cannot be undone.`)) return
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('testimonials').delete().eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null)
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Testimonial Moderation"
        description="Approve to publish on the website — rejected items are kept 30 days for reconsideration, then purged automatically."
        action={
          <button onClick={load} aria-label="Refresh" className="rounded-xl border border-gray-200 bg-white p-2.5 text-ink-light transition-colors hover:border-navy hover:text-navy">
            <RefreshCw size={16} />
          </button>
        }
      />

        {/* Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-soft">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold capitalize transition-all',
                tab === t ? 'bg-navy text-white shadow' : 'text-ink-light hover:bg-mist hover:text-navy'
              )}
            >
              {t}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold',
                  tab === t ? 'bg-white/20 text-white' : 'bg-mist text-ink-light'
                )}
              >
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative mb-8">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company or quote… (?q= linkable)"
            className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-soft outline-none placeholder:text-gray-400 focus:border-navy-300"
          />
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-[24px] border border-gray-100 bg-white" />
            ))}
          </div>
        ) : shown.length === 0 && !error ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-white p-16 text-center">
            <p className="font-display font-bold text-navy">No {tab} testimonials</p>
            <p className="mt-2 text-sm text-ink-light">
              {tab === 'pending'
                ? 'New submissions from the website will appear here.'
                : `Nothing has been ${tab} yet.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shown.map((r) => (
              <article key={r.id} className="card-hover flex flex-col rounded-[24px] border border-gray-100 bg-white p-7 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} className={i <= r.rating ? 'fill-gold-400 text-gold-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {tab === 'rejected' && r.rejected_at && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          daysUntilPurge(r.rejected_at) <= 7 ? 'bg-red-50 text-red-600' : 'bg-mist text-ink-light'
                        }`}
                      >
                        {daysUntilPurge(r.rejected_at)}d left
                      </span>
                    )}
                    <time className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                  </div>
                </div>
                <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="font-display text-sm font-bold text-navy">{r.client_name}</p>
                  {(r.client_role || r.company) && (
                    <p className="text-xs text-ink-light">{[r.client_role, r.company].filter(Boolean).join(', ')}</p>
                  )}
                </div>

                {tab === 'pending' && (
                  <div className="mt-5 flex gap-2.5">
                    <button
                      onClick={() => setStatus(r, 'approved')}
                      disabled={busyId === r.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-50"
                    >
                      <Check size={15} /> Approve & Publish
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Reject this testimonial? It will be hidden and kept for ${RETENTION_DAYS} days, then purged automatically.`)) void setStatus(r, 'rejected')
                      }}
                      disabled={busyId === r.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={15} /> Reject
                    </button>
                  </div>
                )}
                {tab === 'approved' && (
                  <div className="mt-5 flex gap-2.5">
                    <button
                      onClick={() => setStatus(r, 'pending')}
                      disabled={busyId === r.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy disabled:opacity-50"
                    >
                      <X size={15} /> Unpublish
                    </button>
                    <button
                      onClick={() => purge(r)}
                      disabled={busyId === r.id}
                      aria-label="Delete permanently"
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                {tab === 'rejected' && (
                  <div className="mt-5 flex gap-2.5">
                    <button
                      onClick={() => setStatus(r, 'pending')}
                      disabled={busyId === r.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy disabled:opacity-50"
                    >
                      <Undo2 size={15} /> Reconsider
                    </button>
                    <button
                      onClick={() => setStatus(r, 'approved')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-green-200 bg-brand-green-50 px-4 py-2.5 text-sm font-semibold text-brand-green-600 transition-colors hover:bg-brand-green-100 disabled:opacity-50"
                    >
                      <Check size={15} /> Restore & Publish
                    </button>
                    <button
                      onClick={() => purge(r)}
                      disabled={busyId === r.id}
                      aria-label="Delete permanently"
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
    </div>
  )
}
