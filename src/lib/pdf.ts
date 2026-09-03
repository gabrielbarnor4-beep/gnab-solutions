const NAVY = '#0B2E59'
const GOLD = '#D4AF37'
// Default brand logo — admin can override per-template via Admin → PDF Templates → header_logo_url
// Also overridden at call sites by site_settings.logo_url when provided
const LOGO_URL = 'https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg'

export interface PdfTemplate {
  id: string
  type: 'quotation' | 'message_reply' | 'receipt'
  name: string
  subject_template: string
  title_template: string
  subtitle_template: string | null
  header_company_name: string
  header_tagline: string
  header_contact: string
  header_logo_url: string
  primary_color: string
  accent_color: string
  body_template: string | null
  table_head: string[]
  totals_template: string[]
  terms_template: string | null
  footer_text: string
  footer_note: string
}

export function interpolate(template: string | null | undefined, vars: Record<string, string>): string {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export async function fetchPdfTemplate(type: PdfTemplate['type']): Promise<PdfTemplate | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase.from('pdf_templates').select('*').eq('type', type).eq('is_active', true).maybeSingle()
    if (!error && data) {
      // normalize jsonb arrays
      const t = data as any
      return {
        ...t,
        table_head: Array.isArray(t.table_head) ? t.table_head : JSON.parse(t.table_head || '[]'),
        totals_template: Array.isArray(t.totals_template) ? t.totals_template : JSON.parse(t.totals_template || '[]'),
      } as PdfTemplate
    }
  } catch { /* fallback */ }
  return null
}

export async function fetchAllPdfTemplates(): Promise<PdfTemplate[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase.from('pdf_templates').select('*').order('type').order('created_at')
    if (!error && data) return data as PdfTemplate[]
  } catch { /* ignore */ }
  return []
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    // SVG has no reliable bitmap path for jsPDF — skip it so a raster fallback is tried
    if (blob.type.includes('svg')) return null
    // Convert to PNG via canvas so JPEG/WEBP/PNG all embed reliably in jsPDF
    try {
      const bitmap = await createImageBitmap(blob)
      const MAX = 440
      const scale = Math.min(1, MAX / Math.max(bitmap.width || 1, bitmap.height || 1))
      const w = Math.max(1, Math.round((bitmap.width || 1) * scale))
      const h = Math.max(1, Math.round((bitmap.height || 1) * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(bitmap, 0, 0, w, h)
      if (typeof bitmap.close === 'function') bitmap.close()
      return canvas.toDataURL('image/png')
    } catch {
      // Fall back to raw data URL (works for plain JPEG/PNG when canvas is unavailable)
      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    }
  } catch {
    return null
  }
}

interface PdfOpts {
  title: string
  subtitle?: string
  customer: { name: string; company?: string; email: string; phone?: string }
  meta?: Record<string, string>
  bodyHtml?: string // plain text with markdown bold
  table?: { head: string[]; rows: string[][] }
  totals?: { label: string; value: string }[]
  terms?: string
  footerNote?: string
  /** Live site logo (site_settings.logo_url) — tried between the template logo and the built-in default */
  logoUrl?: string
}

export async function generateGnabPdf(opts: PdfOpts & { template?: PdfTemplate | null }): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  // Use editable template colors/header if provided, else defaults — well mirrored
  const tpl = opts.template ?? null
  const primary = tpl?.primary_color || NAVY
  const accent = tpl?.accent_color || GOLD
  const logoUrl = tpl?.header_logo_url || LOGO_URL
  const headerName = tpl?.header_company_name || 'GNAB Business Solutions'
  const headerTagline = tpl?.header_tagline || 'One Partner. Endless Solutions.'
  const headerContact = tpl?.header_contact || 'gnabsolutions@gmail.com  •  +233 55 427 3445  •  Accra, Ghana'
  const footerMain = tpl?.footer_text || 'GNAB Business Solutions  •  One Partner. Endless Solutions.  •  Simplifying procurement for organisations across Ghana and Beyond.'
  const footerNoteTpl = tpl?.footer_note || 'This document was generated electronically and is valid without signature.'
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = 0

  // Header bar — uses editable template
  doc.setFillColor(primary)
  doc.rect(0, 0, W, 72, 'F')

  // Logo — try in order: template logo → live site logo → built-in default.
  // Each candidate is attempted in turn: a broken template URL, an SVG, or a
  // WEBP (all of which jsPDF cannot embed raw) must never blank the header —
  // the next candidate is tried until one actually renders.
  const logoCandidates = [...new Set([logoUrl, tpl?.header_logo_url, opts.logoUrl, LOGO_URL].filter((u): u is string => !!u))]
  for (const candidate of logoCandidates) {
    const logoData = await loadImageAsDataUrl(candidate)
    if (!logoData || logoData.startsWith('data:image/svg')) continue
    try {
      doc.addImage(logoData, 'PNG', margin, 14, 44, 44)
      break
    } catch {
      /* try next candidate */
    }
  }
  doc.setTextColor('#FFFFFF')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(headerName, margin + 54, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(accent)
  doc.text(headerTagline, margin + 54, 40)
  doc.setFontSize(7)
  doc.setTextColor('#CBD5E1')
  doc.text(headerContact, margin + 54, 52)

  // Gold accent line
  doc.setFillColor(accent)
  doc.rect(0, 72, W, 3, 'F')

  y = 100
  // Title
  doc.setTextColor(primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(opts.title, margin, y)
  y += 18
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor('#64748B')
    const lines = doc.splitTextToSize(opts.subtitle, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 12 + 8
  }

  // Date + meta
  doc.setFontSize(9)
  doc.setTextColor('#334155')
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${dateStr}`, margin, y)
  y += 12
  if (opts.meta) {
    for (const [k, v] of Object.entries(opts.meta)) {
      if (!v) continue
      doc.setFont('helvetica', 'bold')
      doc.text(`${k}:`, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(v, margin + 90, y)
      y += 12
    }
    y += 4
  }

  // Customer box
  doc.setFillColor('#F8FAFC')
  doc.setDrawColor('#E2E8F0')
  doc.roundedRect(margin, y, W - margin * 2, 52, 6, 6, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(primary)
  doc.text('Customer', margin + 12, y + 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#334155')
  doc.text(`${opts.customer.name}${opts.customer.company ? `  •  ${opts.customer.company}` : ''}`, margin + 12, y + 30)
  doc.text(`${opts.customer.email}${opts.customer.phone ? `  •  ${opts.customer.phone}` : ''}`, margin + 12, y + 42)
  y += 68

  // Body text
  if (opts.bodyHtml) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor('#334155')
    // Strip markdown bold for PDF
    const plain = opts.bodyHtml.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    const lines = doc.splitTextToSize(plain, W - margin * 2)
    // Check page overflow
    if (y + lines.length * 12 > H - 80) {
      doc.addPage()
      y = 40
    }
    doc.text(lines, margin, y)
    y += lines.length * 12 + 16
  }

  // Table
  if (opts.table && opts.table.rows.length > 0) {
    const colW = (W - margin * 2) / opts.table.head.length
    // Header
    doc.setFillColor(primary)
    doc.rect(margin, y, W - margin * 2, 22, 'F')
    doc.setTextColor('#FFFFFF')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    opts.table.head.forEach((h, i) => doc.text(h, margin + 8 + i * colW, y + 14))
    y += 22
    // Rows
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#334155')
    opts.table.rows.forEach((row, ri) => {
      if (y > H - 80) {
        doc.addPage()
        y = 40
      }
      const bg = ri % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
      doc.setFillColor(bg)
      doc.rect(margin, y, W - margin * 2, 18, 'F')
      doc.setDrawColor('#E2E8F0')
      doc.rect(margin, y, W - margin * 2, 18, 'D')
      row.forEach((cell, ci) => {
        const txt = doc.splitTextToSize(cell, colW - 12)[0] ?? cell
        doc.text(txt, margin + 8 + ci * colW, y + 12)
      })
      y += 18
    })
    y += 8
  }

  // Totals
  if (opts.totals && opts.totals.length > 0) {
    const boxW = 200
    const boxX = W - margin - boxW
    for (const t of opts.totals) {
      doc.setFont('helvetica', t.label.toLowerCase().includes('total') ? 'bold' : 'normal')
      doc.setFontSize(9)
      doc.setTextColor(t.label.toLowerCase().includes('total') ? primary : '#475569')
      doc.text(t.label, boxX, y)
      doc.text(t.value, boxX + boxW - doc.getTextWidth(t.value), y)
      y += 14
    }
    y += 6
  }

  // Terms
  if (opts.terms) {
    if (y > H - 100) { doc.addPage(); y = 40 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(primary)
    doc.text('Terms & Notes', margin, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor('#64748B')
    const lines = doc.splitTextToSize(opts.terms, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 10 + 12
  }

  // Footer — uses editable template
  const footerY = H - 30
  doc.setDrawColor(accent)
  doc.setFillColor(accent)
  doc.rect(0, footerY - 8, W, 0.5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor('#64748B')
  doc.text(footerMain, W / 2, footerY + 6, { align: 'center' })
  doc.text(footerNoteTpl, W / 2, footerY + 14, { align: 'center' })

  return doc.output('blob')
}

export async function uploadPdfAndGetUrl(blob: Blob, path: string): Promise<string | null> {
  const { supabase } = await import('@/lib/supabase')
  const { getPublicUrl } = await import('@/lib/supabase')
  const { error } = await supabase.storage.from('documents').upload(path, blob, { contentType: 'application/pdf', upsert: true })
  if (error) return null
  return getPublicUrl('documents', path)
}
