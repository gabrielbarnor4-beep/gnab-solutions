import { describe, it, expect } from 'vitest'
import { getPublicUrl, supabaseImageSrcSet } from '@/lib/supabase'

describe('getPublicUrl with transform', () => {
  it('returns base url without opts', () => {
    const url = getPublicUrl('media', 'general/a.png')
    expect(url).toContain('/storage/v1/object/public/media/general/a.png')
  })
  it('appends width/quality/format', () => {
    const url = getPublicUrl('media', 'home_hero/a.webp', { width: 800, quality: 60, format: 'webp' })
    expect(url).toContain('width=800')
    expect(url).toContain('quality=60')
    expect(url).toContain('format=webp')
  })
  it('supabaseImageSrcSet builds srcset', () => {
    const s = supabaseImageSrcSet('media', 'a.jpg', [400, 800])
    expect(s).toContain('400w')
    expect(s).toContain('800w')
    expect(s).toContain('width=400')
  })
})
