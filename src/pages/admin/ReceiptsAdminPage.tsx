// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Plus, Search, Send, Trash2, Undo2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { fetchPdfTemplate, generateGnabPdf, interpolate, uploadPdfAndGetUrl } from '@/lib/pdf'
import { useSiteSettings } from '@/lib/siteData'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface ReceiptRow {
  id: string
  receipt_number: string
  quote_request_id: string | null
  quotation_id: string | null
  customer_name: string
  company_name: string | null
  email: string
  phone: string | null
  items: { description: string; quantity: number; unit_price: number; total: number }[]
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_method: string | null
  payment_date: string | null
  status: 'draft' | 'issued' | 'paid' | 'cancelled'
  pdf_url: string | null
  notes: string | null
  terms: string | null
  deleted_at: string | null
  created_at: string
}

interface QuoteReq {
  id: string
  rfq_number: string
  full_name: string
  company_name: string | null
  email: string
  phone: string
  status: string
}

interface Quotation {
  id: string
  quotation_number: string
  customer_name: string
  email: string
  total_amount: number
  items: any[]
}

const EMPTY_ITEMS = [{ description: '', quantity: 1, unit_price: 0 }]

export default function ReceiptsAdminPage() {
  const settings = useSiteSettings()
  const [rows, setRows] = useState<ReceiptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showTrash, setShowTrash] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [quoteReqs, setQuoteReqs] = useState<QuoteReq[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [searchParams] = useSearchParams()

  useEffect(() => { document.title = 'Receipts | GNAB Admin' }, [])

  // Auto-open receipt builder when coming from Quotes ?rfq=...
  useEffect(() => {
    const rfq = searchParams.get('rfq')
    if (rfq && !loading && quoteReqs.length > 0) {
      const hit = quoteReqs.find((q) => q.id === rfq)
      if (hit) {
        // delay to ensure load finished
        setTimeout(() => {
          if (!editing) {
            const newRec: any = {
              receipt_number: `RCPT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
              customer_name: hit.full_name,
              company_name: hit.company_name ?? '',
              email: hit.email,
              phone: hit.phone,
              items: [...EMPTY_ITEMS],
              subtotal: 0, discount: 0, tax: 0, total_amount: 0, amount_paid: 0, balance_due: 0,
              payment_method: 'Bank Transfer',
              payment_date: new Date().toISOString().slice(0, 10),
              status: 'issued',
              notes: '',
              terms: '',
              quote_request_id: hit.id,
              quotation_id: null,
            }
            setEditing(newRec)
            // auto-fill from its quotation if exists
            supabase.from('quotations').select('*').eq('quote_request_id', hit.id).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
              if (data) {
                const items = Array.isArray((data as any).items) ? (data as any).items.map((it: any) => ({ description: it.description, quantity: it.quantity, unit_price: it.unit_price })) : [...EMPTY_ITEMS]
                setEditing((prev: any) => prev ? ({ ...prev, quotation_id: (data as any).id, items }) : prev)
              }
            })
          }
        }, 300)
      }
    }
  }, [searchParams, loading, quoteReqs])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('receipts').select('*').order('created_at', { ascending: false }).limit(200)
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/022_receipts_and_pdf_templates.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as ReceiptRow[]) ?? [])
    // also load won quote_requests for issuing
    const { data: qr } = await supabase.from('quote_requests').select('id, rfq_number, full_name, company_name, email, phone, status').in('status', ['won', 'quotation_sent', 'awaiting_customer']).order('created_at', { ascending: false }).limit(50)
    setQuoteReqs((qr as QuoteReq[]) ?? [])
    const { data: qts } = await supabase.from('quotations').select('id, quotation_number, customer_name, email, total_amount, items').eq('status', 'sent').order('created_at', { ascending: false }).limit(50)
    setQuotations((qts as Quotation[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (!showTrash && r.deleted_at) return false
      if (showTrash && !r.deleted_at) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      return [r.receipt_number, r.customer_name, r.company_name, r.email].some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, statusFilter, showTrash])

  const subtotal = useMemo(() => (editing?.items ?? []).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0), [editing?.items])
  const totalAmount = subtotal - (Number(editing?.discount) || 0) + (Number(editing?.tax) || 0)
  const balanceDue = totalAmount - (Number(editing?.amount_paid) || 0)

  const startNew = () => {
    setEditing({
      receipt_number: `RCPT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      customer_name: '',
      company_name: '',
      email: '',
      phone: '',
      items: [...EMPTY_ITEMS],
      subtotal: 0, discount: 0, tax: 0, total_amount: 0, amount_paid: 0, balance_due: 0,
      payment_method: 'Bank Transfer',
      payment_date: new Date().toISOString().slice(0, 10),
      status: 'issued',
      notes: '',
      terms: '',
      quote_request_id: null,
      quotation_id: null,
    })
    setEmailSubject('')
    setEmailBody('')
  }

  const pickQuoteRequest = async (id: string) => {
    const qr = quoteReqs.find((x) => x.id === id)
    if (!qr || !editing) return
    setEditing({ ...editing, quote_request_id: qr.id, customer_name: qr.full_name, company_name: qr.company_name ?? '', email: qr.email, phone: qr.phone })
    // try to load its quotation
    const { data } = await supabase.from('quotations').select('*').eq('quote_request_id', qr.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data) {
      const items = Array.isArray((data as any).items) ? (data as any).items : []
      setEditing((prev) => prev ? ({ ...prev, quotation_id: (data as any).id, items: items.length ? items.map((it: any) => ({ description: it.description, quantity: it.quantity, unit_price: it.unit_price })) : [...EMPTY_ITEMS], subtotal: (data as any).subtotal ?? subtotal, total_amount: (data as any).total_amount ?? totalAmount }) : prev)
      setQuotations((prev) => prev.find((q) => q.id === (data as any).id) ? prev : [...prev, data as Quotation])
    }
  }

  const pickQuotation = (id: string) => {
    const q = quotations.find((x) => x.id === id)
    if (!q || !editing) return
    setEditing({ ...editing, quotation_id: q.id, customer_name: q.customer_name, email: q.email, items: Array.isArray(q.items) ? q.items.map((it: any) => ({ description: it.description, quantity: it.quantity, unit_price: it.unit_price })) : [...EMPTY_ITEMS] })
  }

  const saveReceipt = async (send: boolean) => {
    if (!editing) return
    if (!editing.customer_name?.trim() || !editing.email?.trim()) { setError('Customer name and email are required.'); return }
    if (!editing.items || editing.items.some((it) => !it.description.trim())) { setError('Each line item needs a description.'); return }
    setSaving(true); setError('')
    const validItems = editing.items.map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity) || 0, unit_price: Number(it.unit_price) || 0, total: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) }))
    const receiptNumber = editing.receipt_number?.trim() || `RCPT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const vars = {
      receipt_number: receiptNumber,
      rfq_number: quoteReqs.find((x) => x.id === editing.quote_request_id)?.rfq_number ?? '',
      customer_name: editing.customer_name ?? '',
      company_name: editing.company_name ?? '',
      email: editing.email ?? '',
      date: new Date().toLocaleDateString('en-GB'),
      products_preview: validItems.slice(0, 2).map((it) => it.description).join(', '),
    }
    // Fetch editable receipt template — well mirrored
    const tpl = await fetchPdfTemplate('receipt')
    const title = interpolate(tpl?.title_template || 'Receipt {{receipt_number}}', vars)
    const subtitle = interpolate(tpl?.subtitle_template || 'Payment received for {{rfq_number}}', vars)
    const terms = interpolate(tpl?.terms_template || editing.terms || '', vars)
    const body = tpl?.body_template ? interpolate(tpl.body_template, vars) : editing.notes || undefined
    const tableHead = tpl?.table_head?.length ? tpl.table_head : ['Description', 'Qty', 'Unit Price (GHS)', 'Total (GHS)']
    const totalsLabels = tpl?.totals_template?.length ? tpl.totals_template : ['Subtotal', 'Discount', 'Tax', 'Total Amount', 'Amount Paid', 'Balance Due']

    const pdfBlob = await generateGnabPdf({
      title,
      subtitle,
      customer: { name: editing.customer_name!, company: editing.company_name || undefined, email: editing.email!, phone: editing.phone || undefined },
      meta: {
        'Receipt Number': receiptNumber,
        'Date': vars.date,
        'RFQ': vars.rfq_number || '—',
        'Payment Method': editing.payment_method || '—',
        'Payment Date': editing.payment_date || vars.date,
      },
      table: { head: tableHead, rows: validItems.map((it) => [it.description, String(it.quantity), it.unit_price.toFixed(2), it.total.toFixed(2)]) },
      totals: [
        { label: totalsLabels[0] ?? 'Subtotal', value: `GHS ${subtotal.toFixed(2)}` },
        ...(Number(editing.discount) ? [{ label: totalsLabels[1] ?? 'Discount', value: `GHS ${Number(editing.discount).toFixed(2)}` }] : []),
        ...(Number(editing.tax) ? [{ label: totalsLabels[2] ?? 'Tax', value: `GHS ${Number(editing.tax).toFixed(2)}` }] : []),
        { label: totalsLabels[3] ?? 'Total Amount', value: `GHS ${totalAmount.toFixed(2)}` },
        { label: totalsLabels[4] ?? 'Amount Paid', value: `GHS ${Number(editing.amount_paid || 0).toFixed(2)}` },
        { label: totalsLabels[5] ?? 'Balance Due', value: `GHS ${balanceDue.toFixed(2)}` },
      ],
      terms,
      bodyHtml: body,
      template: tpl,
      logoUrl: settings.logo_url || undefined,
    })
    const pdfPath = `receipts/${receiptNumber}.pdf`
    const pdfUrl = await uploadPdfAndGetUrl(pdfBlob, pdfPath)

    const payload: any = {
      receipt_number: receiptNumber,
      quote_request_id: editing.quote_request_id || null,
      quotation_id: editing.quotation_id || null,
      customer_name: editing.customer_name,
      company_name: editing.company_name || null,
      email: editing.email,
      phone: editing.phone || null,
      items: validItems,
      subtotal,
      discount: Number(editing.discount) || 0,
      tax: Number(editing.tax) || 0,
      total_amount: totalAmount,
      amount_paid: Number(editing.amount_paid) || 0,
      balance_due: balanceDue,
      payment_method: editing.payment_method || null,
      payment_date: editing.payment_date || null,
      status: editing.status || 'issued',
      pdf_url: pdfUrl,
      notes: editing.notes || null,
      terms: editing.terms || null,
    }
    const { error: insErr } = editing.id ? await supabase.from('receipts').update(payload).eq('id', editing.id) : await supabase.from('receipts').insert(payload)
    if (insErr) { setError(`Could not save receipt: ${insErr.message}`); setSaving(false); return }

    if (send) {
      setSending(true)
      const subjectTpl = tpl?.subject_template || 'Your GNAB Receipt {{receipt_number}} — {{rfq_number}}'
      const subject = emailSubject.trim() || interpolate(subjectTpl, vars)
      const customBody = emailBody.trim()
      const bodyHtml = customBody ? `<div style="white-space:pre-wrap">${customBody.replace(/\n/g, '<br>')}</div>` : `<p>Dear ${editing.customer_name},</p><p>Thank you for your payment. Please find your receipt <strong>${receiptNumber}</strong> attached as a premium PDF and linked below.</p>`
      const emailHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:${tpl?.primary_color || '#0B2E59'};color:white;padding:24px;border-radius:16px 16px 0 0"><h2 style="margin:0;color:white">${tpl?.header_company_name || 'GNAB Business Solutions'}</h2><p style="margin:4px 0 0;color:${tpl?.accent_color || '#D4AF37'};font-size:12px;letter-spacing:1px">${tpl?.header_tagline || 'One Partner. Endless Solutions.'}</p></div><div style="padding:24px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px"><p>Dear ${editing.customer_name},</p>${bodyHtml}${pdfUrl ? `<p style="margin-top:16px"><a href="${pdfUrl}" style="display:inline-block;background:${tpl?.primary_color || '#0B2E59'};color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Download Receipt PDF</a></p>` : ''}<p style="color:#64748B;font-size:12px;margin-top:24px">${tpl?.header_contact || 'gnabsolutions@gmail.com • +233 55 427 3445 • Accra, Ghana'}</p></div></div>`
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('send-email', { body: { to: editing.email, subject, html: emailHtml, pdfUrl } })
        if (fnErr) throw new Error((fnErr as Error).message || JSON.stringify(fnErr))
        if ((data as { dev?: boolean })?.dev) setError('Receipt saved and PDF generated. Email was logged (RESEND_API_KEY not configured).')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Receipt saved but email could not be sent.')
      }
      setSending(false)
    }
    setSaving(false)
    setEditing(null)
    void load()
  }

  const del = async (row: ReceiptRow) => {
    if (!window.confirm(`Move receipt ${row.receipt_number} to trash?`)) return
    await supabase.from('receipts').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    void load()
  }
  const restore = async (row: ReceiptRow) => {
    await supabase.from('receipts').update({ deleted_at: null }).eq('id', row.id)
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Receipts"
        description="Issue a system-generated receipt after a quotation is won — emailed as a premium GNAB PDF just like quotations and message replies. Uses the editable Receipt template."
        action={<button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Issue Receipt</button>}
      />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by receipt #, customer, company or email…" className={`${inputClass} pl-11`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} sm:w-40`}>
          <option value="all">All statuses</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r) => r.deleted_at).length})`}</button>
      </div>

      {loading ? <Skeletons count={6} /> : filtered.length === 0 ? (
        <EmptyState title={rows.length === 0 ? 'No receipts yet' : 'No matches'} hint={rows.length === 0 ? 'Issue your first receipt from a won quotation — it will be emailed as a premium PDF.' : undefined} />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-soft">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-ink-light">
                <th className="px-5 py-4 font-bold">Receipt #</th>
                <th className="px-5 py-4 font-bold">Customer</th>
                <th className="px-5 py-4 font-bold">Amount</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Date</th>
                <th className="px-5 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-mist/60">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-bold text-brand-green-600">{r.receipt_number}</td>
                  <td className="px-5 py-3"><p className="font-semibold text-navy">{r.customer_name}</p><p className="text-xs text-ink-light">{r.company_name || r.email}</p></td>
                  <td className="px-5 py-3 font-semibold text-navy">GHS {Number(r.total_amount).toFixed(2)}</td>
                  <td className="px-5 py-3"><Badge tone={r.status === 'paid' ? 'green' : r.status === 'issued' ? 'navy' : r.status === 'cancelled' ? 'red' : 'gray'}>{r.status}</Badge></td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {r.pdf_url && <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-navy hover:bg-navy-50"><ExternalLink size={14} /></a>}
                      {!r.deleted_at ? (
                        <>
                          <button onClick={() => { setEditing({ ...r, items: Array.isArray(r.items) ? r.items.map((it: any) => ({ description: it.description, quantity: it.quantity, unit_price: it.unit_price })) : [...EMPTY_ITEMS] }); setEmailSubject(''); setEmailBody('') }} className="rounded-lg p-2 text-ink-light hover:bg-navy-50"><FileText size={14} /></button>
                          <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                        </>
                      ) : (
                        <button onClick={() => restore(r)} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50"><Undo2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Builder Drawer — well mirrored to Quotations builder */}
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit Receipt ${editing.receipt_number}` : `New Receipt ${editing?.receipt_number ?? ''}`} subtitle="Uses editable Receipt template — header, colors, footer and terms come from Admin → PDF Templates. Paid receipts can be re-emailed.">
        {editing && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Receipt Number *</span><input value={editing.receipt_number ?? ''} onChange={(e) => setEditing({ ...editing, receipt_number: e.target.value })} className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Status</span><select value={editing.status as string} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className={inputClass}><option value="issued">Issued</option><option value="paid">Paid</option><option value="draft">Draft</option><option value="cancelled">Cancelled</option></select></label>
            </div>

            <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-navy">Link to won quotation (optional but recommended)</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Quote Request (won / sent)</span>
                  <select value={editing.quote_request_id ?? ''} onChange={(e) => pickQuoteRequest(e.target.value)} className={inputClass}>
                    <option value="">— None —</option>
                    {quoteReqs.map((qr) => <option key={qr.id} value={qr.id}>{qr.rfq_number} — {qr.full_name} ({qr.status})</option>)}
                  </select>
                </label>
                <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Quotation (sent)</span>
                  <select value={editing.quotation_id ?? ''} onChange={(e) => pickQuotation(e.target.value)} className={inputClass}>
                    <option value="">— None —</option>
                    {quotations.map((q) => <option key={q.id} value={q.id}>{q.quotation_number} — {q.customer_name} GHS {Number(q.total_amount).toFixed(2)}</option>)}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-ink-light">Picking auto-fills customer and items from the quotation — you can still edit.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Customer Name *</span><input value={editing.customer_name ?? ''} onChange={(e) => setEditing({ ...editing, customer_name: e.target.value })} className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Company</span><input value={editing.company_name ?? ''} onChange={(e) => setEditing({ ...editing, company_name: e.target.value })} className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Email *</span><input type="email" value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Phone</span><input value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={inputClass} /></label>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy">Line items — editable, appears in PDF table (template head: {`{{table_head}}`})</p>
              {editing.items.map((it, idx) => (
                <div key={idx} className="mb-2 grid gap-2 rounded-xl border border-gray-100 bg-white p-3 sm:grid-cols-[1fr_80px_110px_40px]">
                  <input value={it.description} onChange={(e) => { const c = [...editing.items]; c[idx].description = e.target.value; setEditing({ ...editing, items: c }) }} placeholder="Description" className={inputClass} />
                  <input type="number" value={it.quantity} onChange={(e) => { const c = [...editing.items]; c[idx].quantity = Number(e.target.value); setEditing({ ...editing, items: c }) }} placeholder="Qty" className={inputClass} />
                  <input type="number" value={it.unit_price} onChange={(e) => { const c = [...editing.items]; c[idx].unit_price = Number(e.target.value); setEditing({ ...editing, items: c }) }} placeholder="Unit Price" className={inputClass} />
                  <button onClick={() => setEditing({ ...editing, items: editing.items.filter((_, i) => i !== idx) })} disabled={(editing.items?.length ?? 0) === 1} className="rounded-lg p-2 text-red-400 hover:bg-red-50 disabled:opacity-30"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => setEditing({ ...editing, items: [...(editing.items ?? []), { description: '', quantity: 1, unit_price: 0 }] })} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-600 hover:underline"><Plus size={12} /> Add line</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Discount (GHS)</span><input type="number" value={editing.discount as any ?? 0} onChange={(e) => setEditing({ ...editing, discount: Number(e.target.value) })} className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Tax (GHS)</span><input type="number" value={editing.tax as any ?? 0} onChange={(e) => setEditing({ ...editing, tax: Number(e.target.value) })} className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Amount Paid (GHS)</span><input type="number" value={editing.amount_paid as any ?? 0} onChange={(e) => setEditing({ ...editing, amount_paid: Number(e.target.value) })} className={inputClass} /></label>
            </div>
            <div className="rounded-xl bg-white p-3 text-right text-sm border">
              <p>Subtotal: <span className="font-bold text-navy">GHS {subtotal.toFixed(2)}</span></p>
              <p className="font-bold text-navy">Total: GHS {totalAmount.toFixed(2)} · Balance: GHS {balanceDue.toFixed(2)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Payment Method</span><input value={editing.payment_method ?? ''} onChange={(e) => setEditing({ ...editing, payment_method: e.target.value })} placeholder="Bank Transfer / Cash / MoMo" className={inputClass} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Payment Date</span><input type="date" value={editing.payment_date ?? ''} onChange={(e) => setEditing({ ...editing, payment_date: e.target.value })} className={inputClass} /></label>
            </div>

            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Notes (appears as body in PDF)</span><textarea rows={2} value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Thank you for your payment..." className={`${inputClass} resize-none`} /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Terms (uses Receipt template terms if empty)</span><textarea rows={2} value={editing.terms ?? ''} onChange={(e) => setEditing({ ...editing, terms: e.target.value })} className={`${inputClass} resize-none`} /></label>

            <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-navy">Email to customer — uses Receipt template subject</p>
              <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-ink-light">Email Subject *</span><input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Your GNAB Receipt — RCPT-... (leave blank to use template)" className={inputClass} /></label>
              <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-ink-light">Email Body (optional)</span><textarea rows={3} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Dear {{customer_name}}, ..." className={`${inputClass} resize-none`} /></label>
              <p className="mt-2 text-xs text-ink-light">Variables: {'{{receipt_number}}, {{rfq_number}}, {{customer_name}}'} — also available in PDF template.</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => saveReceipt(false)} disabled={saving || sending} className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-navy hover:border-navy disabled:opacity-60">{saving ? 'Saving…' : 'Save Draft'}</button>
              <button onClick={() => saveReceipt(true)} disabled={saving || sending} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"><Send size={14} /> {saving || sending ? 'Sending…' : 'Save & Email PDF'}</button>
            </div>
            <p className="text-center text-xs text-ink-light">PDF header/colors/footer come from <span className="font-semibold">Admin → PDF Templates → Receipt</span> — well mirrored.</p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
