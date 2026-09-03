import { useCallback, useEffect, useState } from 'react'
import { Check, FileText, Trash2, Upload } from 'lucide-react'
import { supabase, getPublicUrl } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'

interface Doc {
  id: string
  file_name: string
  file_path: string
  file_size: number | null
  is_active: boolean
  created_at: string
}

const MAX_MB = 15

const formatSize = (bytes: number | null) =>
  bytes == null ? '' : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

export default function DownloadsAdminPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    document.title = 'Downloads | GNAB Admin'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('company_documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/005_catalogue_content.sql first.' : `Failed to load: ${err.message}`)
    setDocs((data as Doc[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const upload = async (file: File) => {
    setError('')
    setNotice('')
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds the ${MAX_MB} MB limit.`)
      return
    }
    setUploading(true)
    const path = `company-profile/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })
    if (!upErr) {
      const { error: dbErr } = await supabase.from('company_documents').insert({
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        is_active: docs.length === 0,
      })
      if (dbErr) setError(`Uploaded but could not register the document: ${dbErr.message}`)
      else setNotice(`"${file.name}" uploaded${docs.length === 0 ? ' and set as the active Company Profile' : ''}.`)
    } else {
      setError(
        upErr.message.includes('row-level security') || upErr.message.includes('Unauthorized')
          ? 'Upload blocked — run migration 005 and make sure your user is in admin_users.'
          : `Upload failed: ${upErr.message}`
      )
    }
    setUploading(false)
    void load()
  }

  const publicUrl = (path: string): string => getPublicUrl('documents', path)

  const activate = async (doc: Doc) => {
    setError('')
    await supabase.from('company_documents').update({ is_active: false }).neq('id', doc.id)
    const { error: err } = await supabase.from('company_documents').update({ is_active: true }).eq('id', doc.id)
    if (err) setError(`Could not activate: ${err.message}`)
    else setNotice(`"${doc.file_name}" is now the active Company Profile.`)
    void load()
  }

  const remove = async (doc: Doc) => {
    if (!window.confirm(`Delete "${doc.file_name}" permanently?`)) return
    setError('')
    await supabase.storage.from('documents').remove([doc.file_path])
    const { error: err } = await supabase.from('company_documents').delete().eq('id', doc.id)
    if (err) setError(`Could not delete: ${err.message}`)
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Downloads — Company Profile"
        description="The active PDF is what visitors download via “Download Company Profile”. If none is active, visitors see a friendly notice instead."
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {!error && notice && (
        <div className="mb-6 rounded-2xl border border-brand-green-200 bg-brand-green-50 px-5 py-4 text-sm font-medium text-brand-green-700">
          {notice}
        </div>
      )}

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-gray-200 bg-white p-10 text-center transition-colors hover:border-navy-200 hover:bg-mist/50">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy">
          <Upload size={22} />
        </span>
        <span className="font-display font-bold text-navy">{uploading ? 'Uploading…' : 'Upload a Company Profile PDF'}</span>
        <span className="text-sm text-ink-light">PDF only · up to {MAX_MB} MB</span>
        <input type="file" accept="application/pdf,.pdf" hidden disabled={uploading} onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
          e.target.value = ''
        }} />
      </label>

      <h3 className="mb-3 mt-8 font-display text-sm font-bold uppercase tracking-wide text-navy">
        Uploaded versions
      </h3>

      {loading ? (
        <Skeletons count={3} />
      ) : docs.length === 0 && !error ? (
        <EmptyState title="No documents yet" hint="Until you upload one, the public button shows the “being updated” message." />
      ) : (
        <ul className="space-y-3">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[20px] border border-gray-100 bg-white p-4 shadow-soft">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <FileText size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{d.file_name}</p>
                <p className="text-xs text-ink-light">
                  {[formatSize(d.file_size), new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {d.is_active ? (
                <Badge tone="green"><Check size={11} className="mr-1 inline" /> Active</Badge>
              ) : (
                <button onClick={() => activate(d)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy">
                  Set Active
                </button>
              )}
              <a href={publicUrl(d.file_path)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy">
                View
              </a>
              <button onClick={() => remove(d)} aria-label={`Delete ${d.file_name}`} className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
