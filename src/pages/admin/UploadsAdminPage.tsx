import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FileText, HardDrive, Image as ImageIcon, Search, Trash2, ExternalLink, RefreshCw, Undo2 } from 'lucide-react'
import { supabase, getPublicUrl } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { ErrorBanner, Skeletons, EmptyState } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'
import { Link } from 'react-router-dom'
import { fetchTrash, purgeTrashItem, restoreTrashItem, type TrashItem } from '@/lib/trash'

type StorageFile = {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: { size?: number; mimetype?: string }
}

type EnrichedFile = StorageFile & {
  fullPath: string
  publicUrl: string
  size: number
  mimetype: string
  prefix: string
  isImage: boolean
}



function formatBytes(b: number): string {
  if (b === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // /storage/v1/object/public/attachments/<path>
    const marker = '/attachments/'
    const idx = u.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(u.pathname.slice(idx + marker.length))
  } catch { return null }
}

export default function UploadsAdminPage() {
  const [files, setFiles] = useState<EnrichedFile[]>([])
  const [allBucketsStats, setAllBucketsStats] = useState<{ bucket: string; count: number; bytes: number }[]>([])
  const [totalAllBytes, setTotalAllBytes] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [filter, setFilter] = useState<string>('all')
  const [bucketFilter, setBucketFilter] = useState<string>('attachments')
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'files' | 'trash'>('files')
  const [trash, setTrash] = useState<TrashItem[]>([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [trashErrors, setTrashErrors] = useState<string[]>([])
  const [trashSelected, setTrashSelected] = useState<Set<string>>(new Set())
  const [trashBusy, setTrashBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      // --- Entire site storage: sum all buckets (media, documents, attachments) ---
      const bucketsToCheck = ['attachments', 'media', 'documents']
      let grandTotal = 0
      const bucketStats: { bucket: string; count: number; bytes: number }[] = []
      // helper to walk a single bucket
      const walkBucket = async (bucket: string): Promise<EnrichedFile[]> => {
        const collected: EnrichedFile[] = []
        const visited = new Set<string>()
        const walk = async (prefix: string) => {
          if (visited.has(`${bucket}:${prefix}`)) return
          visited.add(`${bucket}:${prefix}`)
          let offset = 0
          const pageSize = 1000
          while (true) {
            const { data, error: err } = await supabase.storage.from(bucket).list(prefix || undefined, { limit: pageSize, offset, sortBy: { column: 'created_at', order: 'desc' } })
            if (err) {
              if (!err.message.includes('not found') && !err.message.includes('Bucket')) setError((prev) => prev ? `${prev}; ${bucket}: ${err.message}` : `${bucket}: ${err.message}`)
              break
            }
            if (!data || data.length === 0) break
            for (const f of data as StorageFile[]) {
              const isFolder = !f.id && !f.metadata?.size && f.name && !f.name.includes('.')
              if (isFolder) {
                const subPrefix = prefix ? `${prefix}/${f.name}` : f.name
                await walk(subPrefix)
                continue
              }
              const fullPath = prefix ? `${prefix}/${f.name}` : f.name
              if (!fullPath.includes('.')) continue
              const size = f.metadata?.size ?? 0
              const mime = f.metadata?.mimetype ?? ''
              const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)
              collected.push({
                ...f,
                fullPath,
                publicUrl: getPublicUrl(bucket, fullPath),
                size,
                mimetype: mime,
                prefix: prefix.split('/')[0] || 'root',
                isImage,
              } as EnrichedFile & { bucket: string })
              // attach bucket for later
              ;(collected[collected.length - 1] as any).bucket = bucket
            }
            if (data.length < pageSize) break
            offset += pageSize
            if (offset > 10000) break
          }
        }
        await walk('')
        if (collected.length === 0) {
          for (const p of ['contact', 'quotes', 'suppliers', 'products', 'services', 'home_hero', 'documents']) await walk(p)
        }
        return collected
      }

      // Collect per-bucket and total
      const perBucketFiles: Record<string, EnrichedFile[]> = {}
      for (const b of bucketsToCheck) {
        const filesInBucket = await walkBucket(b)
        const bytes = filesInBucket.reduce((s, f) => s + (f.size || 0), 0)
        bucketStats.push({ bucket: b, count: filesInBucket.length, bytes })
        grandTotal += bytes
        if (b === bucketFilter || (bucketFilter === 'attachments' && b === 'attachments')) {
          // keep attachments files in main table (visitor uploads) — will set below
          if (b === 'attachments') {
            // dedup and sort for main table
            const dedup = new Map<string, EnrichedFile>()
            filesInBucket.forEach((f) => dedup.set(f.fullPath, f))
            const sorted = [...dedup.values()].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
            setFiles(sorted)
          }
        }
        // store for overview
        ;(perBucketFiles as any)[b] = filesInBucket
      }
      // if bucketFilter is not attachments, load that bucket's files into table
      if (bucketFilter !== 'attachments') {
        const filesInBucket = await walkBucket(bucketFilter)
        const dedup = new Map<string, EnrichedFile>()
        filesInBucket.forEach((f) => dedup.set(f.fullPath, f))
        const sorted = [...dedup.values()].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        setFiles(sorted)
      }
      setAllBucketsStats(bucketStats)
      setTotalAllBytes(grandTotal)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load storage')
    } finally {
      setLoading(false)
    }
  }, [bucketFilter])

  const loadTrash = useCallback(async () => {
    setTrashLoading(true); setTrashErrors([])
    const { items, errors } = await fetchTrash()
    setTrash(items); setTrashErrors(errors); setTrashSelected(new Set())
    setTrashLoading(false)
  }, [])

  useEffect(() => { document.title = 'Storage Manager | GNAB Admin'; void load() }, [load])

  const totalBytes = useMemo(() => files.reduce((s, f) => s + (f.size || 0), 0), [files])
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return files.filter((f) => {
      if (filter !== 'all' && f.prefix !== filter && !(filter === 'root' && f.prefix === 'root')) return false
      if (!q) return true
      return f.fullPath.toLowerCase().includes(q) || f.mimetype.toLowerCase().includes(q)
    })
  }, [files, search, filter])

  const getBucketForFile = (file: EnrichedFile): string => (file as any).bucket || 'attachments'

  const removeUrlFromDb = async (publicUrl: string, bucket: string) => {
    // attachments -> contact/quotes/suppliers
    if (bucket === 'attachments') {
      const tables: { table: string; cols: string[] }[] = [
        { table: 'contact_messages', cols: ['attachment_urls'] },
        { table: 'quote_requests', cols: ['attachment_urls'] },
        { table: 'suppliers', cols: ['attachment_urls', 'document_urls'] },
      ]
      for (const { table, cols } of tables) {
        for (const col of cols) {
          try {
            const { data } = await supabase.from(table).select(`id, ${col}`).contains(col as any, [publicUrl] as any).limit(20)
            if (!data || data.length === 0) continue
            for (const row of data as any[]) {
              const arr: string[] = Array.isArray(row[col]) ? row[col] : []
              const next = arr.filter((u) => u !== publicUrl)
              if (next.length !== arr.length) {
                await supabase.from(table).update({ [col]: next } as any).eq('id', row.id)
              }
              const path = extractPathFromUrl(publicUrl)
              if (path) {
                const pathUrl = getPublicUrl(bucket, path)
                if (pathUrl !== publicUrl && arr.includes(pathUrl)) {
                  const next2 = arr.filter((u) => u !== pathUrl)
                  await supabase.from(table).update({ [col]: next2 } as any).eq('id', row.id)
                }
              }
            }
          } catch { /* ignore per table */ }
        }
      }
    } else if (bucket === 'media') {
      // media bucket -> site_images
      try {
        const { data } = await supabase.from('site_images').select('id, url').eq('url', publicUrl).limit(10)
        if (data && data.length > 0) {
          for (const row of data as any[]) {
            await supabase.from('site_images').update({ deleted_at: new Date().toISOString() } as any).eq('id', row.id)
          }
        } else {
          const path = publicUrl.split('/media/')[1] || publicUrl.split('/attachments/')[1]
          if (path) {
            const altUrl = getPublicUrl('media', decodeURIComponent(path))
            const { data: alt } = await supabase.from('site_images').select('id, url').eq('url', altUrl).limit(10)
            if (alt && alt.length > 0) {
              for (const row of alt as any[]) await supabase.from('site_images').update({ deleted_at: new Date().toISOString() } as any).eq('id', row.id)
            }
          }
        }
      } catch { /* ignore */ }
    } else if (bucket === 'documents') {
      try {
        const path = extractPathFromUrl(publicUrl) || publicUrl.split('/documents/')[1]
        if (path) {
          const { data } = await supabase.from('company_documents').select('id, file_path').eq('file_path', decodeURIComponent(path)).limit(10)
          if (data && data.length > 0) {
            for (const row of data as any[]) await supabase.from('company_documents').update({ deleted_at: new Date().toISOString() } as any).eq('id', row.id)
          }
        }
      } catch { /* ignore */ }
    }
  }

  const deleteFile = async (file: EnrichedFile) => {
    const bucket = getBucketForFile(file)
    if (!window.confirm(`Delete "${file.fullPath}" from bucket "${bucket}"?\nThis will permanently free up ${formatBytes(file.size)} and remove it from any record that references it. This cannot be undone.`)) return
    setBusy(file.fullPath)
    setError('')
    const { error: delErr } = await supabase.storage.from(bucket).remove([file.fullPath])
    if (delErr) {
      setError(`Could not delete: ${delErr.message}`)
      setBusy(null)
      return
    }
    await removeUrlFromDb(file.publicUrl, bucket)
    const altPath = extractPathFromUrl(file.publicUrl)
    if (altPath) await removeUrlFromDb(getPublicUrl(bucket, altPath), bucket)
    setSelected((prev) => { const n = new Set(prev); n.delete(file.fullPath); return n })
    setBusy(null)
    void load()
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    const toDelete = files.filter((f) => selected.has(f.fullPath))
    const totalFree = toDelete.reduce((s, f) => s + f.size, 0)
    if (!window.confirm(`Delete ${selected.size} file(s) from "${bucketFilter}"? This will free up ${formatBytes(totalFree)} permanently and clean DB links.`)) return
    setBusy('bulk')
    for (const file of toDelete) {
      const bucket = getBucketForFile(file)
      await supabase.storage.from(bucket).remove([file.fullPath])
      await removeUrlFromDb(file.publicUrl, bucket)
    }
    setSelected(new Set())
    setBusy(null)
    void load()
  }

  const deleteLargest = async (count = 5) => {
    const sorted = [...filtered].sort((a, b) => b.size - a.size).slice(0, count)
    if (sorted.length === 0) return
    if (!window.confirm(`Delete the ${sorted.length} largest file(s) in "${bucketFilter}"?\n${sorted.map((f) => `${f.fullPath} (${formatBytes(f.size)})`).join('\n')}\n\nThis will free ${formatBytes(sorted.reduce((s, f) => s + f.size, 0))}.`)) return
    setBusy('bulk')
    for (const file of sorted) {
      const bucket = getBucketForFile(file)
      await supabase.storage.from(bucket).remove([file.fullPath])
      await removeUrlFromDb(file.publicUrl, bucket)
    }
    setSelected(new Set())
    setBusy(null)
    void load()
  }

  const toggleSelect = (path: string) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(path)) n.delete(path); else n.add(path)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((f) => f.fullPath)))
  }

  const trashFiltered = trash.filter((r) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.tableLabel.toLowerCase().includes(q)
  })

  const purgeOne = async (item: TrashItem) => {
    if (!window.confirm('Permanently delete "' + item.title + '" (' + item.tableLabel + ')? This removes it from Supabase instantly — it cannot be undone.')) return
    setTrashBusy(item.key); setError('')
    const { error } = await purgeTrashItem(item)
    if (error) { setError('Could not permanently delete: ' + error); setTrashBusy(null); return }
    setTrashSelected((prev) => { const n = new Set(prev); n.delete(item.key); return n })
    setTrashBusy(null)
    await loadTrash()
  }

  const restoreOne = async (item: TrashItem) => {
    setTrashBusy(item.key); setError('')
    const { error } = await restoreTrashItem(item)
    if (error) { setError('Could not restore: ' + error); setTrashBusy(null); return }
    setTrashSelected((prev) => { const n = new Set(prev); n.delete(item.key); return n })
    setTrashBusy(null)
    await loadTrash()
  }

  const purgeSelectedTrash = async () => {
    const targets = trashFiltered.filter((r) => trashSelected.has(r.key))
    if (targets.length === 0) return
    if (!window.confirm('Permanently delete ' + targets.length + ' trashed item(s)? They will be removed from Supabase instantly — this cannot be undone.')) return
    setTrashBusy('bulk'); setError('')
    for (const item of targets) {
      const { error } = await purgeTrashItem(item)
      if (error) { setError('Stopped early: ' + error); break }
    }
    setTrashSelected(new Set()); setTrashBusy(null)
    await loadTrash()
  }

  const emptyTrash = async () => {
    if (trash.length === 0) return
    if (!window.confirm('Empty the entire trash (' + trash.length + ' items across all of admin)? Everything is permanently removed from Supabase instantly — this cannot be undone.')) return
    setTrashBusy('bulk'); setError('')
    for (const item of trash) {
      const { error } = await purgeTrashItem(item)
      if (error) { setError('Stopped early: ' + error); break }
    }
    setTrashSelected(new Set()); setTrashBusy(null)
    await loadTrash()
  }

  const freeBytes = Math.max(0, 1024 * 1024 * 1024 - totalAllBytes)
  const pctUsed = Math.min(100, (totalAllBytes / (1024 * 1024 * 1024)) * 100)

  return (
    <div>
      <PageIntro
        title="Storage Manager"
        description="Entire site storage (all buckets) + Trash from every admin page. Delete files to instantly free Supabase Storage — or purge trashed records before their 30-day reconsideration ends."
        action={
          <div className="flex gap-2">
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-light hover:border-navy hover:text-navy disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={deleteSelected} disabled={selected.size === 0 || busy === 'bulk'} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
              <Trash2 size={14} /> Delete selected ({selected.size})
            </button>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Files | Trash tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-soft">
        <button onClick={() => setView('files')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${view === 'files' ? 'bg-navy text-white shadow' : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'}`}>Files</button>
        <button onClick={() => { setView('trash'); void loadTrash() }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${view === 'trash' ? 'bg-navy text-white shadow' : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'}`}>Trash{trash.length > 0 ? ` (${trash.length})` : ''}</button>
        <span className="ml-auto hidden px-2 text-xs text-ink-light sm:inline">Soft-deleted items auto-purge after 30 days — Trash lets you restore or purge them now</span>
      </div>

      {view === 'files' ? (<>
      {/* Entire site storage overview */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-soft lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white"><HardDrive size={20} /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Entire site storage</p>
                <p className="font-display text-2xl font-bold text-navy">{formatBytes(totalAllBytes)} <span className="text-sm font-normal text-ink-light">used</span> <span className="mx-2 text-gray-300">·</span> <span className="text-brand-green-600">{formatBytes(freeBytes)}</span> <span className="text-xs font-normal text-ink-light">free / 1 GB</span></p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${pctUsed > 80 ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : pctUsed > 50 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-brand-green-50 text-brand-green-700 ring-1 ring-brand-green-200'}`}>{pctUsed.toFixed(1)}% used</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-mist">
            <div className="h-full bg-gradient-to-r from-navy via-navy-500 to-brand-green-500 transition-all" style={{ width: `${pctUsed}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {allBucketsStats.map((b) => (
              <div key={b.bucket} className={`rounded-xl p-3 ${bucketFilter === b.bucket ? 'bg-navy text-white' : 'bg-mist'}`}>
                <p className={`font-bold ${bucketFilter === b.bucket ? 'text-white' : 'text-navy'}`}>{b.bucket}</p>
                <p className={bucketFilter === b.bucket ? 'text-white/80' : 'text-ink-light'}>{b.count} files · {formatBytes(b.bytes)}</p>
              </div>
            ))}
            {allBucketsStats.length === 0 && <p className="col-span-3 text-sm text-ink-light">No buckets found — run load</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-ink-light">Manage space:</span>
            <button onClick={() => deleteLargest(5)} disabled={filtered.length === 0 || busy === 'bulk'} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-40">Delete largest 5 in {bucketFilter}</button>
            <button onClick={() => { const oldest = [...filtered].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')).slice(0, 5); if (oldest.length) { if (window.confirm(`Delete oldest ${oldest.length} in ${bucketFilter}?`)) { setSelected(new Set(oldest.map((f) => f.fullPath))); setTimeout(() => deleteSelected(), 100) } } }} disabled={filtered.length === 0} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-ink-light hover:border-navy">Delete oldest 5</button>
            <span className="text-xs text-ink-light">Supabase free tier is 1 GB — when bar hits 80% consider cleaning Attachments.</span>
          </div>
        </div>
        <div className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">Current bucket: {bucketFilter}</p>
          <p className="mt-1 font-display text-xl font-bold text-navy">{formatBytes(totalBytes)} <span className="text-xs font-normal text-ink-light">in {bucketFilter}</span></p>
          <div className="mt-3 space-y-1.5 text-sm">
            {['contact','quotes','suppliers','root'].map((p) => {
              const count = files.filter((f) => f.prefix === p).length
              const bytes = files.filter((f) => f.prefix === p).reduce((s, f) => s + f.size, 0)
              if (count === 0) return null
              return <div key={p} className="flex justify-between"><span className="font-medium text-navy">{p}/</span><span className="text-ink-light">{count} · {formatBytes(bytes)}</span></div>
            })}
            {files.length === 0 && <p className="text-sm text-ink-light">No files in {bucketFilter}</p>}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-light">Attachments are capped at 5MB/file and 5/files per submission (see 020 guards). Images are auto-compressed to 1280w webp — new uploads are tiny.</p>
        </div>
      </div>

      {/* Bucket switcher + Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="flex gap-2">
          {[
            { id: 'attachments', label: 'Attachments' },
            { id: 'media', label: 'Media' },
            { id: 'documents', label: 'Documents' },
          ].map((b) => (
            <button key={b.id} onClick={() => { setBucketFilter(b.id); setFilter('all'); setSelected(new Set()) }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${bucketFilter === b.id ? 'bg-navy text-white' : 'border border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{b.label}</button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search in ${bucketFilter}…`} aria-label="Search uploads" className={`${inputClass} pl-11`} />
        </div>
        {bucketFilter === 'attachments' ? (
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by folder" className={`${inputClass} sm:w-48`}>
            <option value="all">All folders</option>
            <option value="contact">contact/</option>
            <option value="quotes">quotes/</option>
            <option value="suppliers">suppliers/</option>
            <option value="root">root/</option>
          </select>
        ) : (
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by folder" className={`${inputClass} sm:w-48`}>
            <option value="all">All folders</option>
          </select>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-medium text-navy">
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="h-4 w-4 accent-brand-green-500" />
          Select all
        </label>
      </div>

      {loading ? <Skeletons count={6} /> : filtered.length === 0 ? (
        <EmptyState title={files.length === 0 ? 'No files' : 'No matches'} hint={files.length === 0 ? 'When visitors attach files via Contact/Quote/Supplier forms, they appear here in Attachments. You can delete them to free Supabase storage (1 GB free).' : 'Try a different search or folder filter.'} />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-mist/50 text-[11px] uppercase tracking-wider text-ink-light">
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="h-4 w-4 accent-brand-green-500" aria-label="Select all" /></th>
                  <th className="px-2 py-3 font-bold">Preview</th>
                  <th className="px-3 py-3 font-bold">File</th>
                  <th className="px-3 py-3 font-bold">Size</th>
                  <th className="px-3 py-3 font-bold">Created</th>
                  <th className="px-3 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((f) => (
                  <tr key={f.fullPath} className="hover:bg-mist/40">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(f.fullPath)} onChange={() => toggleSelect(f.fullPath)} className="h-4 w-4 accent-brand-green-500" aria-label={`Select ${f.fullPath}`} />
                    </td>
                    <td className="px-2 py-3">
                      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-mist">
                        {f.isImage ? <img src={f.publicUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <FileText size={18} className="text-gray-400" />}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[260px] truncate font-medium text-navy" title={f.fullPath}>{f.fullPath}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400">{f.isImage ? <ImageIcon size={12} /> : <FileText size={12} />} {f.mimetype || 'unknown'} · {f.prefix}/</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-ink-light">{formatBytes(f.size)}</td>
                    <td className="px-3 py-3 text-xs text-gray-400">{f.created_at ? new Date(f.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <a href={f.publicUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-ink-light hover:bg-navy-50 hover:text-navy" aria-label={`Open ${f.fullPath}`}><ExternalLink size={14} /></a>
                        <a href={f.publicUrl} download={f.name} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 hover:text-navy" aria-label={`Download ${f.fullPath}`}><Download size={14} /></a>
                        <button onClick={() => deleteFile(f)} disabled={busy === f.fullPath} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-40" aria-label={`Delete ${f.fullPath}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-mist/30 px-4 py-3 text-xs text-ink-light">
            Showing {filtered.length} of {files.length} file(s) · {formatBytes(filtered.reduce((s, f) => s + f.size, 0))} selected: {formatBytes(files.filter((f) => selected.has(f.fullPath)).reduce((s, f) => s + f.size, 0))}
          </div>
        </div>
      )}
      </>) : (
      <>
      {/* Trash — every soft-deleted item anywhere in admin */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trashed items…" aria-label="Search trash" className={inputClass + ' pl-11'} />
        </div>
        <button onClick={() => void loadTrash()} disabled={trashLoading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-light hover:border-navy hover:text-navy disabled:opacity-50">
          <RefreshCw size={14} className={trashLoading ? 'animate-spin' : ''} /> Refresh trash
        </button>
        <button onClick={emptyTrash} disabled={trash.length === 0 || trashBusy === 'bulk'} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          <Trash2 size={14} /> Empty trash{trash.length > 0 ? ' (' + trash.length + ')' : ''}
        </button>
      </div>
      {trashErrors.length > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">Some tables could not be read: {trashErrors.join('; ')}</p>
      )}
      {trashLoading ? <Skeletons count={4} /> : trashFiltered.length === 0 ? (
        <EmptyState title={trash.length === 0 ? 'Trash is empty' : 'No matches'} hint={trash.length === 0 ? 'Deleted items from anywhere in admin wait here for 30 days before the nightly purge removes them forever. Restore them, or purge them now.' : 'Try a different search.'} />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-soft">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-mist/40 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
              <input type="checkbox" checked={trashSelected.size === trashFiltered.length && trashFiltered.length > 0} onChange={() => { if (trashSelected.size === trashFiltered.length) setTrashSelected(new Set()); else setTrashSelected(new Set(trashFiltered.map((r) => r.key))) }} className="h-4 w-4 accent-brand-green-500" />
              Select all
            </label>
            <button onClick={purgeSelectedTrash} disabled={trashSelected.size === 0 || trashBusy === 'bulk'} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
              <Trash2 size={14} /> Delete forever ({trashSelected.size})
            </button>
            <span className="ml-auto text-xs text-ink-light">Showing {trashFiltered.length} of {trash.length} trashed item(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-mist/50 text-[11px] uppercase tracking-wider text-ink-light">
                  <th className="px-4 py-3" aria-label="Select"></th>
                  <th className="px-3 py-3 font-bold">Item</th>
                  <th className="px-3 py-3 font-bold">Location</th>
                  <th className="px-3 py-3 font-bold">Deleted</th>
                  <th className="px-3 py-3 font-bold">Days left</th>
                  <th className="px-3 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trashFiltered.map((r) => (
                  <tr key={r.key} className="hover:bg-mist/40">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={trashSelected.has(r.key)} onChange={() => { setTrashSelected((prev) => { const n = new Set(prev); if (n.has(r.key)) n.delete(r.key); else n.add(r.key); return n }) }} className="h-4 w-4 accent-brand-green-500" aria-label={'Select ' + r.title} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[280px] truncate font-medium text-navy" title={r.title}>{r.title}</p>
                      {r.sub && <p className="max-w-[280px] truncate text-xs text-gray-400">{r.sub}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <Link to={r.page} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy ring-1 ring-navy-100 hover:bg-navy hover:text-white">{r.tableLabel}</Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">{new Date(r.deletedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-3">
                      <span className={"rounded-full px-3 py-1 text-xs font-bold " + (r.daysLeft <= 0 ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : r.daysLeft <= 7 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-mist text-ink-light ring-1 ring-gray-200')}>
                        {r.daysLeft <= 0 ? 'Due today' : r.daysLeft + 'd left'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => restoreOne(r)} disabled={trashBusy === r.key} title="Restore" aria-label={'Restore ' + r.title} className="rounded-lg p-2 text-brand-green-600 hover:bg-brand-green-50 disabled:opacity-40"><Undo2 size={14} /></button>
                        <button onClick={() => purgeOne(r)} disabled={trashBusy === r.key} title="Delete forever" aria-label={'Delete forever ' + r.title} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-mist/30 px-4 py-3 text-xs text-ink-light">
            The nightly purge (03:22) permanently removes anything past 30 days. Purging here removes the row — and any files it references — from Supabase instantly.
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
