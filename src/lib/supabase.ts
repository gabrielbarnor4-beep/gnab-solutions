import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Untyped client for now — tables are created by migrations 001→027.
// For strict typing after `supabase gen types`, use `createClient<Database>`.
// See src/types/supabase.ts for the generated template.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Public URL for an object in a storage bucket.
 * Rec 7 — supports Supabase image transform for performance.
 * When opts.width/quality are given and the object is an image,
 * we append `?width=&quality=` so Supabase CDN resizes on the fly
 * (phone never downloads desktop 2400w). No transform for PDFs.
 */
export function getPublicUrl(
  bucket: string,
  path: string,
  opts?: { width?: number; quality?: number; format?: 'webp' | 'origin' },
): string {
  const res = supabase.storage.from(bucket).getPublicUrl(path) as unknown as {
    data: { publicUrl: string }
  }
  let url = res.data.publicUrl
  if (opts && (opts.width || opts.quality || opts.format)) {
    const params = new URLSearchParams()
    if (opts.width) params.set('width', String(opts.width))
    if (opts.quality) params.set('quality', String(opts.quality))
    if (opts.format) params.set('format', opts.format)
    // Supabase image transform is triggered by these query params;
    // for non-images (pdf) the params are ignored safely.
    const qs = params.toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
  }
  return url
}

/** Helper: responsive Supabase image URL (mirrors imgSrcSet for Unsplash) */
export function supabaseImageSrcSet(bucket: string, path: string, widths: number[] = [400, 800, 1200]): string {
  return widths.map((w) => `${getPublicUrl(bucket, path, { width: w, quality: 60, format: 'webp' })} ${w}w`).join(', ')
}
