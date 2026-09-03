import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { supabase, getPublicUrl } from '@/lib/supabase'

const MAX_MB = 5
const COMPRESS_MAX_W = 1280
const COMPRESS_QUALITY = 0.72

async function compressImage(file: File): Promise<File> {
  // keep non-images and already-small files as-is
  if (!file.type.startsWith('image/') || file.size < 300 * 1024) return file
  // webp is ~30% smaller than jpeg; fall back to jpeg if webp not supported
  const tryCompress = async (mime: string, ext: string): Promise<File | null> => {
    try {
      const url = URL.createObjectURL(file)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = url
      })
      const scale = Math.min(1, COMPRESS_MAX_W / img.naturalWidth)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mime, COMPRESS_QUALITY))
      if (!blob) return null
      // don't bloat small images
      if (blob.size >= file.size) return null
      return new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mime })
    } catch { return null }
  }
  // try webp first, then jpeg
  return (await tryCompress('image/webp', 'webp')) ?? (await tryCompress('image/jpeg', 'jpg')) ?? file
}

/** Uploads an image to the `media` bucket and hands back its public URL. */
export function ImageUploader({
  value,
  onChange,
  label = 'Image',
  folder = 'general',
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  folder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WebP…).')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image is too large. Maximum size is ${MAX_MB} MB.`)
      return
    }
    setBusy(true)
    // 1A: compress client-side to 1280w webp ~0.7 quality before upload (13x saving on phone photos)
    let outFile: File = file
    try {
      outFile = await compressImage(file)
    } catch { /* fallback to original */ }
    const ext = outFile.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage.from('media').upload(path, outFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: outFile.type || file.type,
    })
    setBusy(false)
    if (upErr) {
      setError(
        upErr.message.includes('row-level security') || upErr.message.includes('Unauthorized')
          ? 'Upload blocked — run migration 005 and make sure your user is in admin_users.'
          : `Upload failed: ${upErr.message}`
      )
      return
    }
    onChange(getPublicUrl('media', path))
  }

  return (
    <div>
      <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">{label}</span>
      <div className="flex items-start gap-4">
        <div className="flex h-24 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-mist/60">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={22} className="text-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste an image URL or upload a file…"
            className="w-full rounded-xl border border-gray-200 bg-mist/60 px-4 py-2.5 text-sm outline-none transition-all focus:border-navy-400 focus:bg-white focus:ring-4 focus:ring-navy-100"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy transition-colors hover:border-navy disabled:opacity-50"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {busy ? 'Uploading…' : 'Upload'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Remove image"
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
