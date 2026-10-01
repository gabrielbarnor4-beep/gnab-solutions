import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Search, Plus, Trash2, FileText, Receipt, Send, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Pagination, Skeletons, type Tone } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { fetchPdfTemplate, generateGnabPdf, interpolate, suggestQuotePackage, uploadPdfAndGetUrl, type QuotePackageType } from '@/lib/pdf'
import { isITSolutionsCategory } from '@/lib/catalogue'
import { useSiteSettings } from '@/lib/siteData'
import { useQuerySearch } from '@/components/admin/AdminSearch'

const PAGE_SIZE = 25

export interface Row {
  id: string
  rfq_number: string
  status: string
  assigned_to: string | null
  internal_notes: string | null
  full_name: string
  company_name: string | null
  email: string
  phone: string
  whatsapp: string | null
  industry: string | null
  product_category: string | null
  product_item: string | null
  other_category: string | null
  other_product: string | null
  products_or_services: string
  quantity: string | null
  delivery_location: string | null
  message: string | null
  attachment_urls: string[] | null
  created_at: string
}

const STATUSES = [
  ['new', 'New'],
  ['under_review', 'Under Review'],
  ['quotation_prepared', 'Quotation Prepared'],
  ['quotation_sent', 'Quotation Sent'],
  ['awaiting_customer', 'Awaiting Customer'],
  ['won', 'Won'],
  ['lost', 'Lost'],
  ['closed', 'Closed'],
] as const

const TONE: Record<string, Tone> = {
  new: 'gold',
  under_review: 'blue',
  quotation_prepared: 'navy',
  quotation_sent: 'navy',
  awaiting_customer: 'gray',
  won: 'green',
  lost: 'red',
  closed: 'gray',
}
const LABEL = Object.fromEntries(STATUSES)

export default function QuotesAdminPage() {
  const settings = useSiteSettings()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Row | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [quotations, setQuotations] = useState<any[]>([])
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false)
  const [items, setItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [quoteMeta, setQuoteMeta] = useState({ valid_until: '', terms: 'Prices valid for 14 days. Delivery as per quotation. Payment terms: 50% advance, 50% on delivery.', notes: '' })
  const [quoteEmailSubject, setQuoteEmailSubject] = useState('')
  const [quoteEmailBody, setQuoteEmailBody] = useState('')
  const [quoteSaving, setQuoteSaving] = useState(false)
  // Package template for IT Solutions RFQs (standard quotation otherwise)
  const [pkgType, setPkgType] = useState<QuotePackageType>('quotation')
  const [pkgLoading, setPkgLoading] = useState(false)

  useEffect(() => {
    document.title = 'Quote Requests | GNAB Admin'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 500)
    if (err) {
      setError(
        err.code === '42P01' || err.message.includes('does not exist')
          ? 'The quote_requests table does not exist yet. Run supabase/migrations/004_business_tables.sql in your Supabase SQL editor.'
          : `Failed to load: ${err.message}`
      )
    }
    setRows((data as Row[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selected) { setQuotations([]); return }
    supabase.from('quotations').select('*').eq('quote_request_id', selected.id).is('deleted_at', null).order('created_at', { ascending: false }).then(({ data }) => setQuotations((data as any[]) ?? []))
  }, [selected?.id])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      return [r.rfq_number, r.full_name, r.company_name, r.email]
        .some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, statusFilter])

  useEffect(() => { setPage(1) }, [search, statusFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const exportCsv = () => {
    const header = ['RFQ Number', 'Date', 'Customer', 'Company', 'Email', 'Phone', 'Industry', 'Category', 'Product', 'Requirement', 'Quantity', 'Delivery Location', 'Status', 'Assigned To']
    const lines = filtered.map((r) =>
      [
        r.rfq_number,
        new Date(r.created_at).toISOString(),
        r.full_name,
        r.company_name ?? '',
        r.email,
        r.phone,
        r.industry ?? '',
        r.other_category || (r.product_category ?? ''),
        r.other_product || (r.product_item ?? ''),
        r.products_or_services,
        r.quantity ?? '',
        r.delivery_location ?? '',
        LABEL[r.status as string] ?? r.status,
        r.assigned_to ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gnab-quote-requests-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveDetail = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('quote_requests')
      .update({ status: selected.status, assigned_to: selected.assigned_to, internal_notes: selected.internal_notes })
      .eq('id', selected.id)
    setSaving(false)
    if (err) {
      setError(`Could not save changes: ${err.message}`)
      return
    }
    setSelected(null)
    void load()
  }

  const deleteRequest = async () => {
    if (!selected) return
    if (!window.confirm(`Move RFQ ${selected.rfq_number} to trash? It will be permanently deleted after 30 days.`)) return
    setSaving(true)
    const { error: err } = await supabase.from('quote_requests').update({ deleted_at: new Date().toISOString() }).eq('id', selected.id)
    setSaving(false)
    if (err) { setError(`Could not delete: ${err.message}`); return }
    setSelected(null); void load()
  }

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const totalAmount = subtotal

  const createQuotation = async (send: boolean) => {
    if (!selected) return
    if (items.length === 0 || items.some((it) => !it.description.trim())) { setError('Each line item needs a description.'); return }
    setQuoteSaving(true); setError('')
    const validItems = items.map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity) || 0, unit_price: Number(it.unit_price) || 0, total: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) }))
    const qNumber = `QT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    // Generate PDF — package template for IT RFQs (falls back to standard quotation)
    const usePkg: QuotePackageType = selected && isITSolutionsCategory(selected.product_category) ? pkgType : 'quotation'
    let tpl = await fetchPdfTemplate(usePkg)
    if (!tpl && usePkg !== 'quotation') tpl = await fetchPdfTemplate('quotation')
    const vars = { quotation_number: qNumber, rfq_number: selected.rfq_number, customer_name: selected.full_name, company_name: selected.company_name ?? '', email: selected.email, date: new Date().toLocaleDateString('en-GB'), products_preview: selected.products_or_services.slice(0, 80) }
    const pdfBlob = await generateGnabPdf({
      title: interpolate(tpl?.title_template || `Quotation ${qNumber}`, vars),
      subtitle: interpolate(tpl?.subtitle_template || `In response to ${selected.rfq_number} — ${selected.products_or_services.slice(0, 80)}`, vars),
      customer: { name: selected.full_name, company: selected.company_name ?? undefined, email: selected.email, phone: selected.phone },
      meta: { 'RFQ Number': selected.rfq_number, 'Date': vars.date, 'Valid Until': quoteMeta.valid_until || '14 days' },
      table: { head: tpl?.table_head?.length ? tpl.table_head : ['Description', 'Qty', 'Unit Price (GHS)', 'Total (GHS)'], rows: validItems.map((it) => [it.description, String(it.quantity), it.unit_price.toFixed(2), it.total.toFixed(2)]) },
      totals: [{ label: (tpl?.totals_template?.[0] ?? 'Subtotal'), value: `GHS ${subtotal.toFixed(2)}` }, { label: (tpl?.totals_template?.[1] ?? 'Total Amount'), value: `GHS ${totalAmount.toFixed(2)}` }],
      terms: interpolate(tpl?.terms_template || quoteMeta.terms, vars),
      bodyHtml: tpl?.body_template ? interpolate(tpl.body_template, vars) : (quoteMeta.notes || undefined),
      template: tpl,
      logoUrl: settings.logo_url || undefined,
    })
    const pdfPath = `quotations/${qNumber}.pdf`
    const pdfUrl = await uploadPdfAndGetUrl(pdfBlob, pdfPath)
    const { error: insErr } = await supabase.from('quotations').insert({
      quote_request_id: selected.id,
      quotation_number: qNumber,
      customer_name: selected.full_name,
      company_name: selected.company_name,
      email: selected.email,
      items: validItems,
      subtotal,
      total_amount: totalAmount,
      valid_until: quoteMeta.valid_until || null,
      terms: quoteMeta.terms || null,
      notes: quoteMeta.notes || null,
      status: send ? 'sent' : 'draft',
      pdf_url: pdfUrl,
    })
    if (insErr) { setError(`Could not create quotation: ${insErr.message}`); setQuoteSaving(false); return }
    if (send) {
      // Update RFQ status and send email — use custom subject/body if provided
      await supabase.from('quote_requests').update({ status: 'quotation_sent' }).eq('id', selected.id)
      const subject = quoteEmailSubject.trim() || interpolate(tpl?.subject_template || 'Your GNAB Quotation {{quotation_number}} — {{rfq_number}}', vars)
      const customBody = quoteEmailBody.trim()
      const bodyHtml = customBody
        ? `<div style="white-space:pre-wrap">${customBody.replace(/\n/g, '<br>')}</div>`
        : tpl?.body_template ? `<div style="white-space:pre-wrap">${interpolate(tpl.body_template, vars).replace(/\n/g, '<br>')}</div>` : `<p>Thank you for your enquiry <strong>${selected.rfq_number}</strong>. Please find your quotation <strong>${qNumber}</strong> attached as a premium PDF and linked below.</p>`
      const emailHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:${tpl?.primary_color || '#0B2E59'};color:white;padding:24px;border-radius:16px 16px 0 0"><h2 style="margin:0;color:white">${tpl?.header_company_name || 'GNAB Business Solutions'}</h2><p style="margin:4px 0 0;color:${tpl?.accent_color || '#D4AF37'};font-size:12px;letter-spacing:1px">${tpl?.header_tagline || 'One Partner. Endless Solutions.'}</p></div><div style="padding:24px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px"><p>Dear ${selected.full_name},</p>${bodyHtml}${pdfUrl ? `<p style="margin-top:16px"><a href="${pdfUrl}" style="display:inline-block;background:${tpl?.primary_color || '#0B2E59'};color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Download Quotation PDF</a></p>` : ''}<p style="color:#64748B;font-size:12px;margin-top:24px">Valid until ${quoteMeta.valid_until || '14 days'} • Questions? Reply to this email or call +233 55 427 3445</p></div></div>`
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('send-email', { body: { to: selected.email, subject, html: emailHtml, pdfUrl } })
        if (fnErr) throw new Error((fnErr as Error).message || JSON.stringify(fnErr))
        if ((data as { dev?: boolean })?.dev) setError('Quotation saved and PDF generated. Email was logged (RESEND_API_KEY not configured). Follow the steps below to enable real sending.')
      } catch (err) {
        console.warn('send-email failed', err)
        setError(err instanceof Error ? err.message : 'Quotation saved but email could not be sent. Check RESEND_API_KEY configuration.')
      }
    }
    setQuoteSaving(false); setShowQuoteBuilder(false); setItems([{ description: '', quantity: 1, unit_price: 0 }])
    // Reload quotations
    const { data } = await supabase.from('quotations').select('*').eq('quote_request_id', selected.id).is('deleted_at', null).order('created_at', { ascending: false })
    setQuotations((data as any[]) ?? [])
  }

  const deleteQuotation = async (qid: string) => {
    if (!window.confirm('Move this quotation to trash? It will be permanently deleted after 30 days.')) return
    const { error: err } = await supabase.from('quotations').update({ deleted_at: new Date().toISOString() }).eq('id', qid)
    if (err) setError(`Could not delete: ${err.message}`); else {
      const { data } = await supabase.from('quotations').select('*').eq('quote_request_id', selected!.id).is('deleted_at', null).order('created_at', { ascending: false })
      setQuotations((data as any[]) ?? [])
    }
  }

  return (
    <div>
      <PageIntro
        title="Quote Requests"
        description="Track every RFQ from first enquiry to closed deal."
        action={
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-500 disabled:opacity-40"
          >
            <Download size={15} /> Export CSV ({filtered.length})
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by RFQ number, customer, company or email…"
            aria-label="Search quote requests"
            className={`${inputClass} pl-11`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={`${inputClass} sm:w-56`}
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
          title={rows.length === 0 ? 'No quote requests yet' : 'No matches'}
          hint={rows.length === 0 ? 'New submissions from the website will appear here instantly.' : 'Try adjusting your search or filters.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-[24px] border border-gray-100 bg-white shadow-soft">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-ink-light">
                <th className="px-5 py-4 font-bold">RFQ #</th>
                <th className="px-5 py-4 font-bold">Customer</th>
                <th className="px-5 py-4 font-bold">Requirement</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer transition-colors hover:bg-mist/60">
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-gold-600">{r.rfq_number}</td>
                  <td className="max-w-[220px] px-5 py-4">
                    <p className="truncate font-semibold text-navy">{r.full_name}</p>
                    {r.company_name && <p className="truncate text-xs text-ink-light">{r.company_name}</p>}
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <p className="truncate text-navy">{r.other_product || r.product_item || r.products_or_services}</p>
                    {(r.product_category || r.other_category) && (
                      <p className="truncate text-xs text-ink-light">{r.other_category || r.product_category}</p>
                    )}
                  </td>
                  <td className="px-5 py-4"><Badge tone={TONE[r.status] ?? 'gray'}>{LABEL[r.status as string] ?? r.status}</Badge></td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
        title={selected ? `${selected.rfq_number} — ${selected.full_name}` : ''}
        subtitle={selected?.company_name ?? undefined}
      >
        {selected && (
          <div className="space-y-6">
            <section className="grid gap-x-6 gap-y-4 rounded-2xl border border-gray-100 bg-mist/50 p-5 text-sm sm:grid-cols-2">
              {[
                ['Email', selected.email, `mailto:${selected.email}`],
                ['Phone', selected.phone, `tel:${selected.phone}`],
                ['WhatsApp', selected.whatsapp, selected.whatsapp ? `https://wa.me/${selected.whatsapp.replace(/\D/g, '')}` : undefined],
                ['Industry', selected.industry],
                ['Quantity', selected.quantity],
                ['Delivery Location', selected.delivery_location],
                [
                  'Product Category',
                  selected.other_category
                    ? `${selected.other_category} (specified)`
                    : selected.product_category,
                ],
                [
                  'Product / Item',
                  selected.other_product
                    ? `${selected.other_product} (specified)`
                    : selected.product_item,
                ],
              ].map(([label, value, href]) => (
                <div key={label as string}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">{label}</p>
                  {href && value ? (
                    <a href={href as string} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-green-600 hover:underline">
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium text-navy">{value || '—'}</p>
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Products or Services Required</p>
                <p className="mt-1 whitespace-pre-wrap font-medium leading-relaxed text-navy">{selected.products_or_services}</p>
              </div>
              {selected.message && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Additional Information</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">{selected.message}</p>
                </div>
              )}
              {selected.attachment_urls && selected.attachment_urls.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-light">Attachments ({selected.attachment_urls.length})</p>
                  <ul className="mt-2 space-y-1">
                    {selected.attachment_urls.map((url, i) => (
                      <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-green-600 hover:underline"><FileText size={14}/> Attachment {i + 1} <ExternalLink size={12}/></a></li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-gray-400 sm:col-span-2">
                Submitted {new Date(selected.created_at).toLocaleString('en-GB')}
              </p>
            </section>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ink-light">Status</span>
                <select
                  value={selected.status}
                  onChange={(e) => setSelected({ ...selected, status: e.target.value })}
                  className={inputClass}
                >
                  {STATUSES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-ink-light">Assigned To</span>
                <input
                  type="text"
                  value={selected.assigned_to ?? ''}
                  onChange={(e) => setSelected({ ...selected, assigned_to: e.target.value })}
                  placeholder="Staff member name"
                  className={inputClass}
                />
              </label>
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

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <button onClick={deleteRequest} className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">Move Request to Trash (30-day retention)</button>
            </div>

            {/* Quotations for this RFQ */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Quotations</h3>
                <button onClick={() => {
                  const willOpen = !showQuoteBuilder
                  if (willOpen && selected) {
                    setQuoteEmailSubject(`Your GNAB Quotation — ${selected.rfq_number}`)
                    setQuoteEmailBody('')
                    // Pre-select the matching package template for IT RFQs
                    setPkgType(suggestQuotePackage(selected.product_category, selected.products_or_services))
                  }
                  setShowQuoteBuilder(willOpen)
                }} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-1.5 text-xs font-bold text-white hover:bg-navy-600"><Plus size={12}/> {showQuoteBuilder ? 'Close' : 'New Quotation'}</button>
              </div>
              {quotations.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {quotations.map((q: any) => (
                    <li key={q.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-mist p-3">
                      <div>
                        <p className="font-mono text-xs font-bold text-navy">{q.quotation_number} · {q.status}</p>
                        <p className="text-xs text-ink-light">GHS {Number(q.total_amount).toFixed(2)} · {new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        {q.pdf_url && <a href={q.pdf_url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-navy hover:bg-white"><ExternalLink size={14}/></a>}
                        <button onClick={() => deleteQuotation(q.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14}/></button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-light">No quotations yet. Use the builder below to prepare one — it will be sent as a premium GNAB PDF (editable in PDF Templates).</p>
              )}
              {(selected.status === 'won' || selected.status === 'quotation_sent') && (
                <div className="mt-4 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-4">
                  <p className="text-sm font-bold text-brand-green-700">Won? Issue a receipt</p>
                  <p className="mt-1 text-xs text-ink-light">This RFQ is <span className="font-semibold">{selected.status}</span> — you can now issue a system-generated receipt and email it as a PDF.</p>
                  <a href={`/admin/receipts?rfq=${selected.id}`} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-green-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-green-600"><Receipt size={12} /> Issue Receipt</a>
                </div>
              )}

              {showQuoteBuilder && (
                <div className="mt-6 space-y-4 rounded-2xl border border-navy-100 bg-mist/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-navy">Quotation Builder — add line items</p>
                  {selected && isITSolutionsCategory(selected.product_category) && (
                    <div className="rounded-xl border border-gold-200 bg-gold-50 p-3">
                      <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Package template — decides PDF terms, body and subject</span>
                        <select value={pkgType} onChange={(e) => setPkgType(e.target.value as QuotePackageType)} className={inputClass}>
                          <option value="quotation">Standard quotation</option>
                          <option value="website_package">Standard website package</option>
                          <option value="erp_discovery">ERP discovery (fixed fee)</option>
                        </select>
                      </label>
                      <button
                        onClick={async () => {
                          setPkgLoading(true); setError('')
                          const tpl = await fetchPdfTemplate(pkgType)
                          setPkgLoading(false)
                          if (tpl && tpl.default_items.length > 0) {
                            setItems(tpl.default_items.map((it) => ({ description: it.description, quantity: it.quantity || 1, unit_price: it.unit_price || 0 })))
                          } else {
                            setError('No standard items saved on this template yet — add them in Admin → PDF Templates.')
                          }
                        }}
                        disabled={pkgLoading}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-600 disabled:opacity-60"
                      >
                        <Plus size={12} /> {pkgLoading ? 'Loading…' : 'Load standard package items'}
                      </button>
                    </div>
                  )}
                  {items.map((it, idx) => (
                    <div key={idx} className="grid gap-2 rounded-xl border border-gray-100 bg-white p-3 sm:grid-cols-[1fr_80px_110px_40px]">
                      <input value={it.description} onChange={(e) => { const c=[...items]; c[idx]!.description=e.target.value; setItems(c)}} placeholder="Description" className={inputClass} />
                      <input type="number" value={it.quantity} onChange={(e) => { const c=[...items]; c[idx]!.quantity=Number(e.target.value); setItems(c)}} placeholder="Qty" className={inputClass} />
                      <input type="number" value={it.unit_price} onChange={(e) => { const c=[...items]; c[idx]!.unit_price=Number(e.target.value); setItems(c)}} placeholder="Unit Price" className={inputClass} />
                      <button onClick={() => setItems(items.filter((_,i)=>i!==idx))} disabled={items.length===1} className="rounded-lg p-2 text-red-400 hover:bg-red-50 disabled:opacity-30"><Trash2 size={14}/></button>
                    </div>
                  ))}
                  <button onClick={() => setItems([...items, { description:'', quantity:1, unit_price:0 }])} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-600 hover:underline"><Plus size={12}/> Add line item</button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Valid Until</span><input type="date" value={quoteMeta.valid_until} onChange={(e)=>setQuoteMeta({...quoteMeta, valid_until:e.target.value})} className={inputClass}/></label>
                    <div className="rounded-xl bg-white p-3 text-right text-sm">
                      <p>Subtotal: <span className="font-bold text-navy">GHS {subtotal.toFixed(2)}</span></p>
                      <p className="font-bold text-navy">Total: GHS {totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Terms</span><textarea rows={2} value={quoteMeta.terms} onChange={(e)=>setQuoteMeta({...quoteMeta, terms:e.target.value})} className={`${inputClass} resize-none`} /></label>
                  <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Notes to customer (appears in PDF)</span><textarea rows={2} value={quoteMeta.notes} onChange={(e)=>setQuoteMeta({...quoteMeta, notes:e.target.value})} placeholder="Thank you for your enquiry..." className={`${inputClass} resize-none`} /></label>
                  <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-navy">Email that will be sent with the PDF</p>
                    <p className="mt-1 text-xs text-ink-light">Customize the subject and the email body. The PDF will be attached/linked automatically.</p>
                    <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-ink-light">Email Subject *</span><input value={quoteEmailSubject} onChange={(e)=>setQuoteEmailSubject(e.target.value)} placeholder="Your GNAB Quotation — RFQ-..." className={inputClass} /></label>
                    <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-ink-light">Email Body (optional — leave blank to use default)</span><textarea rows={3} value={quoteEmailBody} onChange={(e)=>setQuoteEmailBody(e.target.value)} placeholder="Dear {{name}}, Thank you for your enquiry..." className={`${inputClass} resize-none`} /></label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createQuotation(false)} disabled={quoteSaving} className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-navy hover:border-navy disabled:opacity-60">{quoteSaving?'Saving…':'Save Draft'}</button>
                    <button onClick={() => createQuotation(true)} disabled={quoteSaving || !quoteEmailSubject.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"><Send size={14}/> {quoteSaving?'Sending…':'Save & Email PDF'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
