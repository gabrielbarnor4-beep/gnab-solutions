import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, Search, Trash2, Undo2, Send, Download, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Badge, Drawer, EmptyState, ErrorBanner, Skeletons, type Tone } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { fetchPdfTemplate, generateGnabPdf, interpolate, uploadPdfAndGetUrl } from '@/lib/pdf'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Row {
  id: string
  full_name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  attachment_urls: string[]
  status: 'new' | 'replied' | 'closed'
  admin_reply: string | null
  reply_pdf_url: string | null
  replied_at: string | null
  deleted_at: string | null
  created_at: string
}

const TONE: Record<Row['status'], Tone> = { new: 'gold', replied: 'green', closed: 'gray' }

export default function MessagesAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showTrash, setShowTrash] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)
  const [reply, setReply] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/014_messages_quotations_attachments.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Row[]) ?? []); setLoading(false)
  }, [])

  useEffect(() => { document.title = 'Messages | GNAB Admin'; void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!r.deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (q && !(`${r.full_name} ${r.email} ${r.subject ?? ''} ${r.message}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, statusFilter, showTrash])

  const softDelete = async (row: Row) => {
    if (!window.confirm(`Move message from "${row.full_name}" to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id)
    const { error: err } = await supabase.from('contact_messages').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null); void load()
  }

  const restore = async (row: Row) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('contact_messages').update({ deleted_at: null }).eq('id', row.id)
    if (err) setError(`Could not restore: ${err.message}`)
    setBusyId(null); void load()
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) { setError('Reply message is required.'); return }
    if (!emailSubject.trim()) { setError('Email subject is required.'); return }
    setSending(true); setError('')
    try {
      // Generate premium PDF — uses editable Message Reply template (well mirrored)
      const tpl = await fetchPdfTemplate('message_reply')
      const vars = { subject: selected.subject ?? '', admin_reply: reply, customer_name: selected.full_name, email: selected.email, date: new Date().toLocaleDateString('en-GB') }
      const pdfBlob = await generateGnabPdf({
        title: interpolate(tpl?.title_template || 'Response to Your Message', vars),
        subtitle: interpolate(tpl?.subtitle_template || (selected.subject ? `Re: ${selected.subject}` : ''), vars),
        customer: { name: selected.full_name, email: selected.email, phone: selected.phone ?? undefined },
        meta: { 'Original Message': selected.message.slice(0, 120) + (selected.message.length > 120 ? '…' : ''), 'Date': vars.date },
        bodyHtml: interpolate(tpl?.body_template || reply, vars),
        footerNote: tpl?.footer_note || 'This is an official response from GNAB Business Solutions.',
        template: tpl,
      })
      const pdfPath = `replies/contact-${selected.id}-${Date.now()}.pdf`
      const pdfUrl = await uploadPdfAndGetUrl(pdfBlob, pdfPath)

      // Update DB
      const { error: updErr } = await supabase.from('contact_messages').update({
        admin_reply: reply,
        reply_pdf_url: pdfUrl,
        replied_at: new Date().toISOString(),
        status: 'replied',
      }).eq('id', selected.id)
      if (updErr) throw new Error(updErr.message)

      // Send email via edge function — uses editable Message Reply template (well mirrored)
      const subjectVars = { subject: selected.subject ?? '', admin_reply: reply, customer_name: selected.full_name, email: selected.email, date: new Date().toLocaleDateString('en-GB') }
      const emailSubjectTpl = tpl?.subject_template ? interpolate(tpl.subject_template, subjectVars) : (selected.subject ? `Re: ${selected.subject} — GNAB Business Solutions` : 'Response from GNAB Business Solutions')
      // Use custom subject if admin typed one, else template
      const finalSubject = emailSubject.trim() || emailSubjectTpl
      // Update state if we used template so next save remembers
      if (!emailSubject.trim() && tpl?.subject_template) setEmailSubject(finalSubject)
      const customBodyHtml = emailBody.trim() ? `<div style="white-space:pre-wrap">${emailBody.replace(/\n/g,'<br>')}</div>` : tpl?.body_template ? `<div style="white-space:pre-wrap">${interpolate(tpl.body_template, subjectVars).replace(/\n/g,'<br>')}</div>` : `<p>Thank you for contacting GNAB Business Solutions. Please find our response below and attached as a premium PDF document.</p><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0;white-space:pre-wrap">${reply.replace(/\n/g,'<br>')}</div>`
      const emailHtml = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:${tpl?.primary_color || '#0B2E59'};color:white;padding:24px;border-radius:16px 16px 0 0">
            <h2 style="margin:0;color:white">${tpl?.header_company_name || 'GNAB Business Solutions'}</h2>
            <p style="margin:4px 0 0;color:${tpl?.accent_color || '#D4AF37'};font-size:12px;letter-spacing:1px">${tpl?.header_tagline || 'One Partner. Endless Solutions.'}</p>
          </div>
          <div style="padding:24px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px">
            <p>Dear ${selected.full_name},</p>
            ${customBodyHtml}
            ${pdfUrl ? `<p style="margin-top:16px"><a href="${pdfUrl}" style="display:inline-block;background:${tpl?.primary_color || '#0B2E59'};color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">Download PDF Response</a></p>` : ''}
            <p style="color:#64748B;font-size:12px;margin-top:24px">${tpl?.header_contact || 'GNAB Business Solutions • gnabsolutions@gmail.com • +233 55 427 3445 • Accra, Ghana'}</p>
          </div>
        </div>
      `
      // Override subject with template-aware one for sending
      if (!emailSubject.trim()) setEmailSubject(finalSubject)
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('send-email', {
          body: { to: selected.email, subject: finalSubject, html: emailHtml, pdfUrl },
        })
        if (fnErr) throw new Error((fnErr as Error).message || JSON.stringify(fnErr))
        if ((data as { dev?: boolean })?.dev) {
          setError('Reply saved and PDF generated. Email was logged (RESEND_API_KEY not configured). Follow the steps below to enable real sending.')
        }
      } catch (err) {
        console.warn('send-email failed', err)
        setError(err instanceof Error ? err.message : 'Reply saved but email could not be sent. Check RESEND_API_KEY configuration.')
      }

      setSelected(null); setReply(''); setEmailSubject(''); setEmailBody(''); void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (selected) {
      setReply(selected.admin_reply ?? '')
      setEmailSubject(selected.subject ? `Re: ${selected.subject} — GNAB Business Solutions` : 'Response from GNAB Business Solutions')
      setEmailBody('')
    }
  }, [selected?.id])

  return (
    <div>
      <PageIntro
        title="Messages"
        description="Messages from 'Send Us a Message' form. Reply generates a premium PDF and emails the visitor. Trash kept 30 days."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r)=>r.deleted_at).length})`}</button>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={()=>setError('')} />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_160px]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by name, email, subject or message…" aria-label="Search messages" className={`${inputClass} pl-11`} />
        </div>
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} aria-label="Filter by status" className={inputClass}>
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? <Skeletons count={6}/> : filtered.length===0 ? (
        <EmptyState title={showTrash ? 'Trash is empty' : rows.length===0 ? 'No messages yet' : 'No matches'} hint={showTrash ? 'Deleted messages are kept for 30 days.' : 'Messages from the Contact form will appear here.'} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r)=>(
            <div key={r.id} className={`rounded-[20px] border p-5 shadow-soft ${r.deleted_at ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white hover:border-navy-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={()=>setSelected(r)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[r.status]}>{r.status}</Badge>
                    <span className="text-xs text-ink-light">{new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric'})} · {new Date(r.created_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit'})}</span>
                    {r.attachment_urls?.length > 0 && <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy">{r.attachment_urls.length} attachment(s)</span>}
                    {r.deleted_at && <span className="text-xs text-amber-700">Trash — {new Date(r.deleted_at).toLocaleDateString()}</span>}
                  </div>
                  <p className="mt-2 truncate font-display font-bold text-navy">{r.full_name} <span className="font-normal text-ink-light">— {r.subject || 'No subject'}</span></p>
                  <p className="truncate text-sm text-ink-light">{r.email} {r.phone ? `· ${r.phone}` : ''}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink">{r.message}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {!r.deleted_at ? (
                    <>
                      <button onClick={()=>setSelected(r)} className="rounded-lg p-2 text-navy hover:bg-navy-50" aria-label="Reply"><Send size={15}/></button>
                      <a href={`mailto:${r.email}`} className="rounded-lg p-2 text-ink-light hover:bg-navy-50" aria-label="Email"><Mail size={15}/></a>
                      <button onClick={()=>softDelete(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label="Delete"><Trash2 size={15}/></button>
                    </>
                  ) : (
                    <button onClick={()=>restore(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50"><Undo2 size={15}/></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!selected} onClose={()=>setSelected(null)} title={selected ? `Message from ${selected.full_name}` : ''} subtitle={selected ? `${selected.email} · ${new Date(selected.created_at).toLocaleString('en-GB')}` : undefined}>
        {selected && (
          <div className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-mist/50 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-light">Subject</p>
                <p className="font-medium text-navy">{selected.subject || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-light">Message</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">{selected.message}</p>
              </div>
              {selected.attachment_urls?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-light">Attachments</p>
                  <ul className="mt-2 space-y-1">
                    {selected.attachment_urls.map((url, i)=>(
                      <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-green-600 hover:underline"><Download size={14}/> Attachment {i+1} <ExternalLink size={12}/></a></li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.admin_reply && (
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-green-700">Previous Reply</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{selected.admin_reply}</p>
                  {selected.reply_pdf_url && <a href={selected.reply_pdf_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">View PDF <ExternalLink size={12}/></a>}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Your Reply — Premium PDF Content *</label>
              <textarea rows={6} value={reply} onChange={(e)=>setReply(e.target.value)} placeholder="Write the official letter that will appear in the PDF…" className={`${inputClass} resize-none`} />
              <p className="mt-1 text-xs text-ink-light">This text appears inside the branded PDF with logo and customer details.</p>
            </div>

            <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-sm font-bold text-navy">Email that will be sent with the PDF</p>
              <p className="mt-1 text-xs text-ink-light">Customize the subject and the email body. The PDF will be attached/linked automatically.</p>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-light">Email Subject *</span>
                <input value={emailSubject} onChange={(e)=>setEmailSubject(e.target.value)} placeholder="e.g., Re: Your enquiry — GNAB Business Solutions" className={inputClass} />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-light">Email Body (optional — leave blank to use reply above)</span>
                <textarea rows={4} value={emailBody} onChange={(e)=>setEmailBody(e.target.value)} placeholder="Dear {{name}}, Thank you for contacting us... (if empty, the reply above will be used as the email body)" className={`${inputClass} resize-none`} />
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={sendReply} disabled={sending || !reply.trim() || !emailSubject.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">
                {sending ? 'Sending…' : <><Send size={16}/> Send Reply as PDF Email</>}
              </button>
              <button onClick={()=>setSelected(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light hover:border-navy">Cancel</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
