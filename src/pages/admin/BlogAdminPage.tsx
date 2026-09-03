import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BLOG_CATEGORIES } from '@/lib/siteData.tsx'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Skeletons, type Tone } from '@/components/admin/bits'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image_url: string | null
  author: string | null
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
}

const STATUS_TONE: Record<string, Tone> = { draft: 'gray', published: 'green', archived: 'navy' }

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)

const EMPTY: Post = {
  id: '', title: '', slug: '', excerpt: '', content: '', featured_image_url: '',
  author: 'GNAB Business Solutions', category: 'Company News', tags: [], status: 'draft',
  meta_title: '', meta_description: '', published_at: null,
}

export default function BlogAdminPage() {
  const [rows, setRows] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState<Post | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Blog | GNAB Admin'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/005_catalogue_content.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Post[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (catFilter !== 'all' && r.category !== catFilter) return false
      if (!q) return true
      return [r.title, r.author].some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, statusFilter, catFilter])

  const save = async () => {
    if (!editing) return
    if (!editing.title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError('')
    const slug = (editing.slug.trim() || slugify(editing.title)) ?? ''
    const payload = {
      title: editing.title.trim(),
      slug,
      excerpt: editing.excerpt || null,
      content: editing.content || null,
      featured_image_url: editing.featured_image_url || null,
      author: editing.author || null,
      category: editing.category,
      tags: editing.tags,
      status: editing.status,
      meta_title: editing.meta_title || null,
      meta_description: editing.meta_description || null,
      published_at:
        editing.status === 'published' ? editing.published_at ?? new Date().toISOString() : editing.published_at,
    }
    const { error: err } = editing.id
      ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
      : await supabase.from('blog_posts').insert(payload)
    setSaving(false)
    if (err) {
      setError(
        err.code === '23505'
          ? 'That slug is already used by another article. Pick a different one.'
          : `Could not save article: ${err.message}`
      )
      return
    }
    setEditing(null)
    void load()
  }

  const remove = async (row: Post) => {
    if (!window.confirm(`Delete "${row.title}" permanently?`)) return
    setError('')
    const { error: err } = await supabase.from('blog_posts').delete().eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Blog & Insights"
        description="Only Published articles appear on the public /blog page. Drafts stay private."
        action={
          <button onClick={() => { setEditing({ ...EMPTY }); setTagInput('') }} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-600">
            <Plus size={15} /> New Article
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles…" aria-label="Search articles" className={`${inputClass} pl-11`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className={`${inputClass} sm:w-44`}>
          <option value="all">All statuses</option>
          <option>Draft</option>
          <option>Published</option>
          <option>Archived</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category" className={`${inputClass} sm:w-56`}>
          <option value="all">All categories</option>
          {BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <Skeletons count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title={rows.length === 0 ? 'No articles yet' : 'No matches'} hint={rows.length === 0 ? 'Write your first insight — publish it when it is ready.' : undefined} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id} className="flex items-center gap-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-soft transition-colors hover:border-navy-100">
              <span className="flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mist">
                {r.featured_image_url ? <img src={r.featured_image_url} alt="" className="h-full w-full object-cover" /> : null}
              </span>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setEditing(r); setTagInput(r.tags.join(', ')) }}>
                <p className="truncate font-display font-bold text-navy">{r.title}</p>
                <p className="mt-0.5 text-xs text-ink-light">
                  {[r.category, r.author].filter(Boolean).join(' · ')}
                  {r.published_at && ` · ${new Date(r.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  {' · '}
                  <span className="font-mono">/{r.slug}</span>
                </p>
              </div>
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              <button onClick={() => remove(r)} aria-label={`Delete ${r.title}`} className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit — ${editing.title}` : 'New Article'}>
        {editing && (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Title *</span>
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                placeholder="Article headline"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Slug (URL)</span>
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className={`${inputClass} font-mono text-sm`} />
            </label>
            <ImageUploader value={editing.featured_image_url ?? ''} onChange={(url) => setEditing({ ...editing, featured_image_url: url })} label="Featured Image" folder="blog" />
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Excerpt</span>
              <textarea rows={2} value={editing.excerpt ?? ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="One or two sentences shown in lists and previews" className={`${inputClass} resize-none`} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Article Content</span>
              <textarea rows={12} value={editing.content ?? ''} onChange={(e) => setEditing({ ...editing, content: e.target.value })} placeholder={'Write the article here.\n\nLeave a blank line between paragraphs.'} className={`${inputClass} min-h-[220px] resize-y`} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Category</span>
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputClass}>
                  {BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Author</span>
                <input value={editing.author ?? ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className={inputClass} />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Tags</span>
              <input
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value)
                  setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })
                }}
                placeholder="procurement, ghana, logistics"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Status</span>
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Post['status'] })} className={inputClass}>
                <option value="draft">Draft — hidden from public</option>
                <option value="published">Published — visible at /blog</option>
                <option value="archived">Archived — hidden from public</option>
              </select>
            </label>
            <details className="rounded-2xl border border-gray-100 bg-mist/30 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink-light">SEO (optional)</summary>
              <div className="mt-4 space-y-4">
                <input value={editing.meta_title ?? ''} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} placeholder="Meta title" className={inputClass} />
                <textarea rows={2} value={editing.meta_description ?? ''} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} placeholder="Meta description" className={`${inputClass} resize-none`} />
              </div>
            </details>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Article'}
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
