import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Search, Trash2, Undo2, Send, Clock, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Skeletons, type Tone } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Row {
  id: string
  question: string
  answer: string | null
  status: 'pending' | 'answered' | 'published' | 'rejected'
  asked_count: number
  created_at: string
  updated_at: string
  answered_at: string | null
  deleted_at: string | null
}

const STATUS_LABEL: Record<Row['status'], string> = {
  pending: 'Pending',
  answered: 'Answered',
  published: 'Published',
  rejected: 'Rejected',
}

const TONE: Record<Row['status'], Tone> = {
  pending: 'gold',
  answered: 'blue',
  published: 'green',
  rejected: 'red',
}

export default function AssistantAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showTrash, setShowTrash] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('assistant_questions').select('*').order('created_at', { ascending: false }).limit(200)
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/011_business_hours_and_assistant.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Row[]) ?? []); setLoading(false)
  }, [])

  useEffect(() => { document.title = 'Assistant Q&A | GNAB Admin'; void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!r.deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (q && !(`${r.question} ${r.answer ?? ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, statusFilter, showTrash])

  const save = async () => {
    if (!selected) return
    if (!selected.answer?.trim()) { setError('Answer is required before publishing.'); return }
    setSaving(true); setError('')
    const payload: Partial<Row> = {
      answer: selected.answer.trim(),
      status: selected.status === 'pending' ? 'published' : selected.status,
    } as Partial<Row>
    const { error: err } = await supabase.from('assistant_questions').update(payload).eq('id', selected.id)
    setSaving(false)
    if (err) { setError(`Could not save: ${err.message}`); return }
    setSelected(null); void load()
  }

  const updateStatus = async (row: Row, status: Row['status']) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('assistant_questions').update({ status, answer: row.answer }).eq('id', row.id)
    if (err) setError(`Could not update: ${err.message}`)
    setBusyId(null); void load()
  }

  const softDelete = async (row: Row) => {
    if (!window.confirm(`Move this question to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id)
    const { error: err } = await supabase.from('assistant_questions').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null); void load()
  }

  const restore = async (row: Row) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('assistant_questions').update({ deleted_at: null }).eq('id', row.id)
    if (err) setError(`Could not restore: ${err.message}`)
    setBusyId(null); void load()
  }

  return (
    <div>
      <PageIntro
        title="Assistant Q&A"
        description="Questions the AI couldn't answer are sent here. Provide an answer and publish — next time the assistant will reply precisely. Trash is kept 30 days."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r)=>r.deleted_at).length})`}</button>
            <span className="inline-flex items-center gap-2 rounded-xl bg-mist px-4 py-2.5 text-sm font-semibold text-ink-light"><Clock size={14}/> {rows.filter((r)=>r.status==='pending').length} pending</span>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={()=>setError('')} />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search questions or answers…" aria-label="Search assistant questions" className={`${inputClass} pl-11`} />
        </div>
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} aria-label="Filter by status" className={inputClass}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="answered">Answered</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <Skeletons count={6}/> : filtered.length===0 ? (
        <EmptyState title={showTrash ? 'Trash is empty' : rows.length===0 ? 'No questions yet' : 'No matches'} hint={showTrash ? 'Deleted questions are kept for 30 days.' : 'When the assistant cannot answer, questions appear here. Published answers teach the assistant.'} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r)=>(
            <div key={r.id} className={`rounded-[20px] border p-5 shadow-soft ${r.deleted_at ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white hover:border-navy-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    <span className="text-xs text-ink-light">Asked {r.asked_count}× · {new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric'})}</span>
                    {r.deleted_at && <span className="text-xs font-medium text-amber-700">Trash — {new Date(r.deleted_at).toLocaleDateString()}</span>}
                  </div>
                  <p className="mt-3 font-medium leading-relaxed text-navy">"{r.question}"</p>
                  {r.answer ? (
                    <div className="mt-3 rounded-xl bg-mist px-4 py-3 text-sm leading-relaxed text-ink">
                      <span className="font-semibold text-navy">Answer: </span>{r.answer}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm italic text-ink-light">No answer yet — add one to teach the assistant.</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {!r.deleted_at ? (
                    <>
                      <button onClick={()=>setSelected(r)} className="rounded-lg p-2 text-navy hover:bg-navy-50" aria-label={`Answer ${r.question}`}><Send size={15}/></button>
                      {r.status !== 'published' && r.answer && <button onClick={()=>updateStatus(r,'published')} disabled={busyId===r.id} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50" aria-label="Publish"><Check size={15}/></button>}
                      {r.status !== 'rejected' && <button onClick={()=>updateStatus(r,'rejected')} disabled={busyId===r.id} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50" aria-label="Reject"><Eye size={15}/></button>}
                      <button onClick={()=>softDelete(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label="Delete"><Trash2 size={15}/></button>
                    </>
                  ) : (
                    <button onClick={()=>restore(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50" aria-label="Restore"><Undo2 size={15}/></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!selected} onClose={()=>setSelected(null)} title="Answer Question" subtitle={selected ? `"${selected.question}"` : undefined}>
        {selected && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-mist/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-light">Question (asked {selected.asked_count}×)</p>
              <p className="mt-2 font-medium leading-relaxed text-navy">"{selected.question}"</p>
              <p className="mt-2 text-xs text-gray-400">Received {new Date(selected.created_at).toLocaleString('en-GB')}</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Answer *</span>
              <textarea rows={6} value={selected.answer ?? ''} onChange={(e)=>setSelected({...selected, answer: e.target.value})} placeholder="Provide the precise answer the assistant should give next time…" className={`${inputClass} resize-none`} />
              <p className="mt-1.5 text-xs text-ink-light">Use markdown bold and links like [label](/path). The assistant will reply with this answer verbatim when a similar question is asked.</p>
            </label>

            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Status</span>
              <select value={selected.status} onChange={(e)=>setSelected({...selected, status: e.target.value as Row['status']})} className={inputClass}>
                <option value="pending">Pending</option>
                <option value="answered">Answered</option>
                <option value="published">Published (assistant will use)</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving || !selected.answer?.trim()} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving?'Saving…':'Save & Publish'}</button>
              <button onClick={()=>setSelected(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light hover:border-navy">Cancel</button>
            </div>

            <p className="text-center text-xs text-ink-light">Published answers are cached for 30 seconds, then the assistant serves them instantly.</p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
