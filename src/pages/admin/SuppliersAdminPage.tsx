import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Pagination, Skeletons, type Tone } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

const PAGE_SIZE = 25

interface Row {
  id: string
  status: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  whatsapp: string | null
  business_address: string | null
  website: string | null
  registration_number: string | null
  tin_number: string | null
  category: string | null
  categories_supplied: string[]
  products_services: string | null
  years_in_business: string | null
  areas_of_operation: string | null
  description: string | null
  additional_info: string | null
  document_urls: string[]
  internal_notes: string | null
  created_at: string
}

const STATUSES = [
  ['pending', 'Pending'],
  ['under_review', 'Under Review'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
] as const

const TONE: Record<string, Tone> = { pending: 'gold', under_review: 'blue', approved: 'green', rejected: 'red' }
const LABEL = Object.fromEntries(STATUSES)

export default function SuppliersAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Row | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = 'Supplier Registrations | GNAB Admin'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 500)
    if (err) {
      setError(
        err.code === '42P01' || err.message.includes('does not exist')
          ? 'The suppliers table does not exist yet. Run supabase/migrations/004_business_tables.sql in your Supabase SQL editor.'
          : `Failed to load: ${err.message}`
      )
    }
    setRows((data as Row[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      return [r.company_name, r.contact_person, r.email, r.category]
        .some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, statusFilter])

  useEffect(() => { setPage(1) }, [search, statusFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const saveDetail = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('suppliers')
      .update({ status: selected.status, internal_notes: selected.internal_notes })
      .eq('id', selected.id)
    setSaving(false)
    if (err) {
      setError(`Could not save changes: ${err.message}`)
      return
    }
    setSelected(null)
    void load()
  }

  const remove = async (row: Row) => {
    if (!window.confirm(`Permanently delete the registration from ${row.company_name}? This cannot be undone.`)) return
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('suppliers').delete().eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null)
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Supplier Registrations"
        description="Review applications from businesses wanting to join the GNAB supplier network."
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact person or email…"
            aria-label="Search suppliers"
            className={`${inputClass} pl-11`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={`${inputClass} sm:w-52`}
        >
          <option value="all">All statuses</option>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Skeletons count={6} />
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          title={rows.length === 0 ? 'No supplier registrations yet' : 'No matches'}
          hint={rows.length === 0 ? 'Applications from the Become a Supplier form will appear here instantly.' : 'Try adjusting your search or filters.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-[24px] border border-gray-100 bg-white shadow-soft">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-ink-light">
                <th className="px-5 py-4 font-bold">Company</th>
                <th className="px-5 py-4 font-bold">Contact</th>
                <th className="px-5 py-4 font-bold">Category</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Submitted</th>
                <th className="px-5 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-mist/60">
                  <td className="cursor-pointer px-5 py-4" onClick={() => setSelected(r)}>
                    <p className="font-semibold text-navy">{r.company_name}</p>
                    {r.website && <p className="truncate text-xs text-ink-light">{r.website.replace(/^https?:\/\//, '')}</p>}
                  </td>
                  <td className="max-w-[200px] cursor-pointer px-5 py-4" onClick={() => setSelected(r)}>
                    <p className="font-medium text-navy">{r.contact_person}</p>
                    <p className="truncate text-xs text-ink-light">{r.email}</p>
                  </td>
                  <td className="max-w-[160px] cursor-pointer px-5 py-4" onClick={() => setSelected(r)}>
                    <p className="text-navy">{r.category ?? '—'}</p>
                    {r.categories_supplied?.length > 0 && (
                      <p className="truncate text-xs text-ink-light">{r.categories_supplied.join(', ')}</p>
                    )}
                  </td>
                  <td className="cursor-pointer px-5 py-4" onClick={() => setSelected(r)}>
                    <Badge tone={TONE[r.status] ?? 'gray'}>{LABEL[r.status as string] ?? r.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); void remove(r) }}
                      disabled={busyId === r.id}
                      aria-label={`Delete registration from ${r.company_name}`}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filtered.length > PAGE_SIZE && (
        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.company_name ?? ''}
        subtitle={selected ? `${selected.contact_person} · applied ${new Date(selected.created_at).toLocaleDateString('en-GB')}` : undefined}
      >
        {selected && (
          <div className="space-y-6">
            <section className="grid gap-x-6 gap-y-4 rounded-2xl border border-gray-100 bg-mist/50 p-5 text-sm sm:grid-cols-2">
              {[
                ['Email', selected.email, `mailto:${selected.email}`],
                ['Phone', selected.phone, `tel:${selected.phone}`],
                ['WhatsApp', selected.whatsapp, selected.whatsapp ? `https://wa.me/${selected.whatsapp.replace(/\D/g, '')}` : undefined],
                ['Website', selected.website, selected.website ?? undefined],
                ['Business Address', selected.business_address],
                ['Registration No.', selected.registration_number],
                ['TIN / Tax ID', selected.tin_number],
                ['Years in Business', selected.years_in_business],
                ['Business Category', selected.category],
                ['Areas of Operation', selected.areas_of_operation],
              ].map(([label, value, href]) => (
                <div key={label as string}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">{label}</p>
                  {href && value ? (
                    <a href={href as string} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-brand-green-600 hover:underline">
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium text-navy">{value || '—'}</p>
                  )}
                </div>
              ))}
              {selected.categories_supplied?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Supplies</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selected.categories_supplied.map((c) => (
                      <Badge key={c} tone="navy">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selected.products_services && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Products / Services Supplied</p>
                  <p className="mt-1 whitespace-pre-wrap font-medium leading-relaxed text-navy">{selected.products_services}</p>
                </div>
              )}
              {selected.description && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Company Description</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">{selected.description}</p>
                </div>
              )}
              {selected.additional_info && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Additional Information</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">{selected.additional_info}</p>
                </div>
              )}
              {selected.document_urls?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Documents</p>
                  <ul className="mt-1.5 space-y-1">
                    {selected.document_urls.map((url, i) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-green-600 hover:underline">
                          Document {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <div className="grid gap-4">
              <div>
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ink-light">Status</span>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setSelected({ ...selected, status: v })}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition-all ${
                        selected.status === v ? 'bg-navy text-white ring-navy' : 'bg-white text-ink-light ring-gray-200 hover:ring-navy'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ink-light">Internal Notes</span>
                <textarea
                  rows={4}
                  value={selected.internal_notes ?? ''}
                  onChange={(e) => setSelected({ ...selected, internal_notes: e.target.value })}
                  placeholder="Visible to admins only…"
                  className={`${inputClass} resize-none`}
                />
              </label>
            </div>

            <button
              onClick={saveDetail}
              disabled={saving}
              className="w-full rounded-xl bg-brand-green-500 py-3 font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
