import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Pencil, Plus, Search, Trash2, Undo2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Product {
  id: string
  name: string
  category: string | null
  short_description: string | null
  description: string | null
  image_url: string | null
  featured: boolean
  status: 'active' | 'inactive'
  display_order: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  deleted_at: string | null
}

interface Category {
  id: string
  name: string
  display_order: number
}

const EMPTY: Product = {
  id: '', name: '', category: '', short_description: '', description: '', image_url: '',
  featured: false, status: 'active', display_order: 0, seo_title: '', seo_description: '',
  created_at: new Date().toISOString(),
  deleted_at: null,
}

export default function ProductsAdminPage() {
  const [rows, setRows] = useState<Product[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showCats, setShowCats] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [showTrash, setShowTrash] = useState(false)

  useEffect(() => {
    document.title = 'Products | GNAB Admin'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [{ data: products, error: pErr }, { data: categories, error: cErr }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: !sortDesc }),
      supabase.from('product_categories').select('*').order('display_order'),
    ])
    if (pErr || cErr) {
      setError(
        pErr?.code === '42P01' || cErr?.code === '42P01'
          ? 'Tables not found. Run supabase/migrations/005_catalogue_content.sql in your Supabase SQL editor.'
          : `Failed to load: ${(pErr ?? cErr)?.message}`
      )
    }
    setRows((products as Product[]) ?? [])
    setCats((categories as Category[]) ?? [])
    setLoading(false)
  }, [sortDesc])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!r.deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (catFilter !== 'all' && r.category !== catFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      return [r.name, r.short_description].some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, catFilter, statusFilter, showTrash])

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    const payload = {
      name: editing.name.trim(),
      category: editing.category || null,
      short_description: editing.short_description || null,
      description: editing.description || null,
      image_url: editing.image_url || null,
      featured: editing.featured,
      status: editing.status,
      display_order: Number(editing.display_order) || 0,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
    }
    if (!payload.name) {
      setError('Product name is required.')
      setSaving(false)
      return
    }
    const { error: err } = editing.id
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (err) {
      setError(`Could not save product: ${err.message}`)
      return
    }
    setEditing(null)
    void load()
  }

  const toggleField = async (row: Product, field: 'featured' | 'status') => {
    setBusyId(row.id)
    setError('')
    const patch =
      field === 'featured'
        ? { featured: !row.featured }
        : { status: row.status === 'active' ? 'inactive' : 'active' }
    const { error: err } = await supabase.from('products').update(patch).eq('id', row.id)
    if (err) setError(`Could not update: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const remove = async (row: Product) => {
    if (!window.confirm(`Move "${row.name}" to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const restore = async (row: Product) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('products').update({ deleted_at: null }).eq('id', row.id)
    if (err) setError(`Could not restore: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const addCategory = async () => {
    const name = newCat.trim()
    if (!name) return
    setError('')
    const { error: err } = await supabase
      .from('product_categories')
      .insert({ name, display_order: cats.length + 1 })
    if (err) {
      setError(err.code === '23505' ? `"${name}" already exists.` : `Could not add category: ${err.message}`)
      return
    }
    setNewCat('')
    void load()
  }

  const removeCategory = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products keep their text but lose the grouping.`)) return
    setError('')
    const { error: err } = await supabase.from('product_categories').delete().eq('id', cat.id)
    if (err) setError(`Could not delete category: ${err.message}`)
    void load()
  }

  const moveCategory = async (cat: Category, dir: -1 | 1) => {
    const idx = cats.findIndex((c) => c.id === cat.id)
    const target = cats[idx + dir]
    if (!target) return
    await Promise.all([
      supabase.from('product_categories').update({ display_order: target.display_order }).eq('id', cat.id),
      supabase.from('product_categories').update({ display_order: cat.display_order }).eq('id', target.id),
    ])
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Product Catalogue"
        description="Manage what appears on the public Products page. Inactive or trashed products are hidden from visitors. Trash is permanently deleted after 30 days."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r)=>r.deleted_at).length})`}</button>
            <button
              onClick={() => setShowCats(!showCats)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy"
            >
              Categories ({cats.length})
            </button>
            <button
              onClick={() => setEditing({ ...EMPTY })}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-600"
            >
              <Plus size={15} /> Add Product
            </button>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Category manager */}
      {showCats && (
        <div className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Categories</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {cats.map((c, i) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-mist py-1.5 pl-4 pr-1.5 text-sm font-medium text-navy">
                {c.name}
                <span className="flex flex-col">
                  <button onClick={() => moveCategory(c, -1)} disabled={i === 0} aria-label={`Move ${c.name} up`} className="disabled:opacity-25">
                    <ChevronUp size={11} />
                  </button>
                  <button onClick={() => moveCategory(c, 1)} disabled={i === cats.length - 1} aria-label={`Move ${c.name} down`} className="disabled:opacity-25">
                    <ChevronDown size={11} />
                  </button>
                </span>
                <button onClick={() => removeCategory(c)} aria-label={`Delete ${c.name}`} className="rounded-full p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex max-w-md gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="New category name…"
              className={inputClass}
            />
            <button onClick={addCategory} className="flex-shrink-0 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-500">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" aria-label="Search products" className={`${inputClass} pl-11`} />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category" className={`${inputClass} sm:w-56`}>
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className={`${inputClass} sm:w-40`}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => setSortDesc(!sortDesc)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy"
        >
          Newest first ↓ / ↑
        </button>
      </div>

      {loading ? (
        <Skeletons count={6} />
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          title={rows.length === 0 ? 'No products yet' : 'No matches'}
          hint={rows.length === 0 ? 'Add your first product — it will appear on the public catalogue immediately.' : 'Try adjusting your search or filters.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-[24px] border border-gray-100 bg-white shadow-soft">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-ink-light">
                <th className="px-5 py-4 font-bold">Product</th>
                <th className="px-5 py-4 font-bold">Category</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Featured</th>
                <th className="px-5 py-4 font-bold">Added</th>
                <th className="px-5 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-mist/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
                        {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{r.name}</p>
                        {r.short_description && <p className="truncate text-xs text-ink-light">{r.short_description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-navy">{r.category ?? '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleField(r, 'status')} disabled={busyId === r.id} aria-label={`Toggle status for ${r.name}`}>
                      <Badge tone={r.status === 'active' ? 'green' : 'gray'}>{r.status}</Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleField(r, 'featured')} disabled={busyId === r.id} aria-label={`Toggle featured for ${r.name}`}>
                      <Badge tone={r.featured ? 'gold' : 'gray'}>{r.featured ? 'Featured' : 'Standard'}</Badge>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    {!r.deleted_at ? (
                      <>
                        <button onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`} className="rounded-lg p-2 text-ink-light transition-colors hover:bg-navy-50 hover:text-navy">
                          <Pencil size={15} />
                        </button>
                        <a href={`/quote?product=${encodeURIComponent(r.name)}${r.category ? `&category=${encodeURIComponent(r.category)}` : ''}`} target="_blank" rel="noopener noreferrer" aria-label={`Preview quote link for ${r.name}`} className="ml-1 inline-block rounded-lg p-2 text-ink-light transition-colors hover:bg-navy-50 hover:text-navy">
                          <ExternalLink size={15} />
                        </a>
                        <button onClick={() => remove(r)} disabled={busyId === r.id} aria-label={`Delete ${r.name}`} className="ml-1 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => restore(r)} disabled={busyId === r.id} aria-label={`Restore ${r.name}`} className="rounded-lg p-2 text-brand-green-600 transition-colors hover:bg-green-50">
                        <Undo2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor drawer */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit — ${editing.name}` : 'Add Product'}
        subtitle="Changes appear on the public catalogue as soon as you save."
      >
        {editing && (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Product Name *</span>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g., A4 Copy Paper 80gsm" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Category</span>
              <select value={editing.category ?? ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputClass}>
                <option value="">— None —</option>
                {cats.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </label>
            <ImageUploader value={editing.image_url ?? ''} onChange={(url) => setEditing({ ...editing, image_url: url })} label="Product Image" folder="products" />
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Short Description</span>
              <textarea rows={2} value={editing.short_description ?? ''} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} placeholder="One-line summary shown on cards" className={`${inputClass} resize-none`} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Detailed Description</span>
              <textarea rows={5} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Specifications, brands, options…" className={`${inputClass} resize-none`} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Status</span>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Product['status'] })} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Display Order</span>
                <input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} />
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-mist/50 p-4">
              <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4 accent-brand-green-500" />
              <span className="text-sm font-medium text-navy">Feature this product</span>
            </label>
            <details className="rounded-2xl border border-gray-100 bg-mist/30 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink-light">SEO (optional)</summary>
              <div className="mt-4 space-y-4">
                <input value={editing.seo_title ?? ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} placeholder="SEO title" className={inputClass} />
                <textarea rows={2} value={editing.seo_description ?? ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} placeholder="SEO description" className={`${inputClass} resize-none`} />
              </div>
            </details>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Product'}
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
